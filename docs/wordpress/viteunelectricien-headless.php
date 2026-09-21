<?php
/**
 * Plugin Name: Vite un électricien — WordPress headless
 * Description: Prévient viteunelectricien.fr à chaque publication d'article (éditeur ou Wisewand) et renvoie les visiteurs du CMS vers le site public.
 * Version: 1.0.0
 *
 * Installation : Extensions → Ajouter → Téléverser l'archive
 * viteunelectricien-headless.zip, puis activer. Le secret partagé avec Vercel
 * (BLOG_REVALIDATE_TOKEN) se saisit dans Réglages → Vite un électricien.
 *
 * Les constantes VUE_SITE_URL et VUE_REVALIDATE_TOKEN, si elles sont définies
 * dans wp-config.php, priment sur ces réglages.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function vue_site_url() {
	if ( defined( 'VUE_SITE_URL' ) ) {
		return untrailingslashit( VUE_SITE_URL );
	}
	return untrailingslashit( get_option( 'vue_site_url', 'https://viteunelectricien.fr' ) );
}

function vue_jeton() {
	if ( defined( 'VUE_REVALIDATE_TOKEN' ) ) {
		return (string) VUE_REVALIDATE_TOKEN;
	}
	return (string) get_option( 'vue_revalidate_token', '' );
}

/**
 * 0. Page Réglages → Vite un électricien : adresse du site public et secret.
 */
add_action(
	'admin_init',
	function () {
		register_setting(
			'vue_headless',
			'vue_site_url',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'esc_url_raw',
				'default'           => 'https://viteunelectricien.fr',
			)
		);
		register_setting(
			'vue_headless',
			'vue_revalidate_token',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
	}
);

add_action(
	'admin_menu',
	function () {
		add_options_page(
			'Vite un électricien',
			'Vite un électricien',
			'manage_options',
			'vue-headless',
			'vue_page_reglages'
		);
	}
);

function vue_page_reglages() {
	$test = null;
	if ( isset( $_POST['vue_tester'] ) && check_admin_referer( 'vue_tester' ) ) {
		$test = wp_remote_post(
			vue_site_url() . '/api/blog/revalidate',
			array(
				'timeout' => 10,
				'headers' => array(
					'Authorization' => 'Bearer ' . vue_jeton(),
					'Content-Type'  => 'application/json',
				),
				'body'    => '{}',
			)
		);
	}
	?>
	<div class="wrap">
		<h1>Vite un électricien — blog headless</h1>
		<p>Les articles publiés ici sont affichés sur <strong><?php echo esc_html( vue_site_url() ); ?>/blog</strong>.
		Le site est prévenu à chaque publication.</p>
		<form method="post" action="options.php">
			<?php settings_fields( 'vue_headless' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="vue_site_url">Adresse du site public</label></th>
					<td><input name="vue_site_url" id="vue_site_url" type="url" class="regular-text"
						value="<?php echo esc_attr( vue_site_url() ); ?>" <?php disabled( defined( 'VUE_SITE_URL' ) ); ?>></td>
				</tr>
				<tr>
					<th scope="row"><label for="vue_revalidate_token">Secret (BLOG_REVALIDATE_TOKEN)</label></th>
					<td><input name="vue_revalidate_token" id="vue_revalidate_token" type="password" class="regular-text"
						autocomplete="off" value="<?php echo esc_attr( get_option( 'vue_revalidate_token', '' ) ); ?>"
						<?php disabled( defined( 'VUE_REVALIDATE_TOKEN' ) ); ?>>
						<p class="description">Même valeur que la variable d'environnement Vercel.</p></td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
		<form method="post">
			<?php wp_nonce_field( 'vue_tester' ); ?>
			<p><button type="submit" name="vue_tester" class="button">Tester la connexion avec le site</button></p>
		</form>
		<?php
		if ( null !== $test ) {
			$code = is_wp_error( $test ) ? $test->get_error_message() : wp_remote_retrieve_response_code( $test );
			$ok   = 200 === $code;
			printf(
				'<div class="notice notice-%s"><p>%s (%s)</p></div>',
				$ok ? 'success' : 'error',
				$ok ? 'Connexion réussie : le site sera prévenu à chaque publication.' : 'Échec : vérifiez l\'adresse et le secret.',
				esc_html( (string) $code )
			);
		}
		?>
	</div>
	<?php
}

/**
 * 1. Rafraîchissement du site à chaque changement d'article.
 *
 * `transition_post_status` couvre la publication, la mise à jour d'un article
 * publié, la dépublication et la mise à la corbeille — quelle que soit la
 * source : éditeur, API REST (Wisewand) ou publication planifiée.
 */
add_action(
	'transition_post_status',
	function ( $nouveau, $ancien, $post ) {
		if ( 'post' !== $post->post_type ) {
			return;
		}
		if ( 'publish' !== $nouveau && 'publish' !== $ancien ) {
			return; // Brouillon qui reste brouillon : rien de visible n'a changé.
		}
		if ( wp_is_post_revision( $post ) || wp_is_post_autosave( $post ) ) {
			return;
		}
		vue_revalider( $post->post_name );
	},
	10,
	3
);

/*
 * Une modification de catégorie change les listes du blog sans toucher aux
 * articles : on invalide aussi dans ce cas.
 */
foreach ( array( 'created_category', 'edited_category', 'delete_category' ) as $crochet ) {
	add_action(
		$crochet,
		function () {
			vue_revalider( '' );
		}
	);
}

function vue_revalider( $slug ) {
	if ( '' === vue_jeton() ) {
		return;
	}
	// Un article mis à la corbeille garde un slug suffixé « __trashed ».
	$slug = preg_replace( '/__trashed$/', '', (string) $slug );

	wp_remote_post(
		vue_site_url() . '/api/blog/revalidate',
		array(
			// Non bloquant : l'enregistrement dans l'admin (ou la réponse à
			// Wisewand) n'attend pas le site public.
			'blocking' => false,
			'timeout'  => 5,
			'headers'  => array(
				'Authorization' => 'Bearer ' . vue_jeton(),
				'Content-Type'  => 'application/json',
			),
			'body'     => wp_json_encode( array( 'slug' => $slug ) ),
		)
	);
}

/**
 * 2. Les liens « Voir l'article » de l'admin, et ceux que l'éditeur insère,
 * pointent directement vers le site public.
 */
add_filter(
	'post_link',
	function ( $lien, $post ) {
		if ( 'publish' !== $post->post_status ) {
			return $lien; // Les aperçus de brouillon restent sur le CMS.
		}
		return vue_site_url() . '/blog/' . $post->post_name;
	},
	10,
	2
);

/**
 * 3. Le front du WordPress n'est pas destiné au public : chaque page est
 * redirigée (301) vers son équivalent sur le site, pour éviter le contenu
 * dupliqué. L'admin, l'API REST, la connexion et les aperçus restent
 * accessibles — Wisewand publie par l'API REST.
 */
add_action(
	'template_redirect',
	function () {
		if ( is_admin() || is_preview() || is_user_logged_in() ) {
			return;
		}
		$cible = vue_site_url() . '/blog';
		if ( is_singular( 'post' ) ) {
			$cible .= '/' . get_post_field( 'post_name', get_queried_object_id() );
		} elseif ( is_category() ) {
			$cible .= '/categorie/' . get_queried_object()->slug;
		}
		wp_redirect( $cible, 301 );
		exit;
	}
);

/*
 * Ceinture et bretelles : même si une URL du CMS échappait à la redirection,
 * elle ne doit pas être indexée. On n'utilise PAS l'option « Demander aux
 * moteurs de ne pas indexer » de WordPress : Yoast la répercuterait en noindex
 * dans les données SEO lues par le site public.
 */
add_action(
	'send_headers',
	function () {
		if ( ! is_admin() ) {
			header( 'X-Robots-Tag: noindex, nofollow', true );
		}
	}
);
