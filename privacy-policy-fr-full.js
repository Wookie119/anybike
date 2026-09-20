/*
AnyBike
File: privacy-policy-fr-full.js
Purpose: Complete French rendering for privacy-policy.html
Date: 20 September 2026
*/
(function(){
  if(location.pathname!=="/privacy-policy.html") return;

  const main=document.querySelector("main");
  const footer=document.querySelector("footer");
  if(!main) return;
  const originalMain=main.innerHTML;
  const originalFooter=footer?footer.innerHTML:"";

  function currentLang(){
    return String(localStorage.getItem("anybikeLanguage")||localStorage.getItem("anybike_language")||document.documentElement.lang||"en").toLowerCase();
  }

  function fr(){
    main.innerHTML = `
<section class="policy-hero">
  <div class="wrap policy-hero-inner">
    <div>
      <div class="eyebrow">Informations de confidentialité AnyBike</div>
      <h1>Politique de confidentialité</h1>
      <p>Cette politique explique comment AnyBike collecte, utilise, conserve et partage les informations personnelles lorsque vous visitez AnyBike.co.uk, créez un compte, nous contactez, achetez ou vendez une moto, rejoignez le réseau Global Buyer ou utilisez nos services.</p>
    </div>
    <div class="policy-date"><strong>Dernière mise à jour</strong>14 juillet 2026</div>
  </div>
</section>

<div class="wrap policy-layout">
  <aside class="policy-nav">
    <h2>Sur cette page</h2>
    <nav class="policy-nav-links" aria-label="Sommaire de la politique de confidentialité">
      <a href="#who-we-are">1. Qui sommes-nous</a>
      <a href="#information-we-collect">2. Informations collectées</a>
      <a href="#how-we-collect">3. Comment elles sont collectées</a>
      <a href="#how-we-use">4. Comment elles sont utilisées</a>
      <a href="#lawful-bases">5. Bases juridiques</a>
      <a href="#sharing">6. Partage des informations</a>
      <a href="#international">7. Traitement international</a>
      <a href="#retention">8. Conservation</a>
      <a href="#security">9. Sécurité</a>
      <a href="#cookies">10. Cookies et stockage</a>
      <a href="#rights">11. Vos droits</a>
      <a href="#children">12. Enfants</a>
      <a href="#changes">13. Modifications</a>
      <a href="#contact">14. Nous contacter</a>
    </nav>
  </aside>

  <div class="policy-content">
    <section class="policy-summary">
      <h2>La confidentialité en bref</h2>
      <p>AnyBike utilise les informations personnelles pour gérer les comptes clients, répondre aux demandes, gérer les achats et ventes de motos, fournir une assistance à la recherche et à l’export, prévenir les abus et améliorer la plateforme. Nous ne vendons pas les informations personnelles.</p>
    </section>

    <section class="policy-section" id="who-we-are">
      <h2>1. Qui sommes-nous</h2>
      <p><strong>AnyBike</strong> exploite le site <strong>AnyBike.co.uk</strong> et propose des services d’achat, de vente, de recherche, de stock et d’assistance export de motos au Royaume-Uni.</p>
      <p>Pour les informations personnelles décrites dans cette politique, AnyBike est l’organisation responsable de décider comment et pourquoi ces informations sont utilisées.</p>
      <p>Les demandes relatives à la confidentialité peuvent être envoyées à : <strong>sales@anybike.co.uk</strong>.</p>
    </section>

    <section class="policy-section" id="information-we-collect">
      <h2>2. Informations que nous collectons</h2>
      <p>Les informations collectées dépendent de votre utilisation d’AnyBike. Elles peuvent inclure :</p>
      <h3>Informations de compte et de profil</h3>
      <ul>
        <li>Nom et adresse e-mail.</li>
        <li>Informations d’authentification par mot de passe gérées via Supabase Auth.</li>
        <li>Nom de l’entreprise, adresse, ville, région, pays et numéro de téléphone.</li>
        <li>Devise et langue préférées.</li>
      </ul>
      <h3>Informations d’achat moto et de demande</h3>
      <ul>
        <li>Motos consultées, enregistrées ou demandées.</li>
        <li>Listes de suivi, recherches enregistrées et motos récemment consultées.</li>
        <li>Questions, offres, budgets et messages de demande.</li>
        <li>Pays de destination et informations du transporteur.</li>
        <li>Historique des conversations avec AnyBike.</li>
      </ul>
      <h3>Informations sur le vendeur de la moto</h3>
      <ul>
        <li>Nom, e-mail, numéro de téléphone et code postal.</li>
        <li>Type de vendeur et informations sur le concessionnaire.</li>
        <li>Immatriculation, marque, modèle, année et kilométrage de la moto.</li>
        <li>État, historique d’entretien, prix souhaité et notes du vendeur.</li>
        <li>Noms des fichiers photo et autres informations sur la moto transmises.</li>
        <li>Confirmation que le vendeur est autorisé à vendre la moto.</li>
      </ul>
      <h3>Réseau Global Buyer et informations professionnelles</h3>
      <ul>
        <li>Coordonnées de l’entreprise et du contact.</li>
        <li>Pays, port de destination et budget d’achat.</li>
        <li>Marques, modèles, années, quantités et limites de kilométrage demandés.</li>
        <li>Volume mensuel d’achat et préférences de transport.</li>
        <li>Liens vers site web, marketplace et réseaux sociaux.</li>
        <li>Notes sur les besoins en recherche, stock et logistique.</li>
      </ul>
      <h3>Informations techniques et d’utilisation</h3>
      <ul>
        <li>Adresse IP et pays ou emplacement approximatif.</li>
        <li>Navigateur, type d’appareil et informations user-agent.</li>
        <li>Pages, motos et fonctionnalités utilisées.</li>
        <li>Dates et heures des demandes, messages et activités du compte.</li>
        <li>Informations nécessaires au maintien des sessions de connexion et à la sécurité.</li>
      </ul>
      <p>Merci de ne pas transmettre d’informations personnelles sensibles qu’AnyBike n’a pas demandées.</p>
    </section>

    <section class="policy-section" id="how-we-collect">
      <h2>3. Comment nous collectons les informations</h2>
      <p>Nous collectons des informations :</p>
      <ul>
        <li>Lorsque vous créez ou mettez à jour un compte My AnyBike.</li>
        <li>Lorsque vous envoyez une demande, une offre ou un message.</li>
        <li>Lorsque vous créez une liste de suivi ou une recherche enregistrée.</li>
        <li>Lorsque vous envoyez une estimation moto ou un formulaire vendeur.</li>
        <li>Lorsque vous envoyez une demande d’achat en volume ou Global Buyer.</li>
        <li>Lorsque vous contactez AnyBike via AnyBike Connect.</li>
        <li>Automatiquement via l’authentification, la sécurité et les technologies du site.</li>
        <li>À partir d’annonces publiques de motos, de vendeurs, de concessionnaires ou de sources professionnelles lorsque cela est autorisé.</li>
      </ul>
      <p>Le site peut utiliser des services de géolocalisation IP et de code postal britannique pour estimer un pays, un emplacement ou une position sur une carte. Ces informations peuvent être imprécises et peuvent être remplacées par celles que vous fournissez directement.</p>
    </section>

    <section class="policy-section" id="how-we-use">
      <h2>4. Comment nous utilisons les informations personnelles</h2>
      <p>AnyBike peut utiliser les informations personnelles pour :</p>
      <ul>
        <li>Créer, authentifier et gérer les comptes clients.</li>
        <li>Afficher les listes de suivi, recherches enregistrées et motos récemment consultées.</li>
        <li>Répondre aux questions, offres et messages.</li>
        <li>Examiner les motos proposées à la vente.</li>
        <li>Mettre en relation les acheteurs avec des motos disponibles ou recherchées.</li>
        <li>Gérer les processus d’achat, paiement, enlèvement, préparation et transport.</li>
        <li>Contacter vendeurs, acheteurs, concessionnaires, transporteurs et partenaires commerciaux.</li>
        <li>Fournir devis, documents, factures et assistance client demandés.</li>
        <li>Diriger les demandes vers le bon service AnyBike.</li>
        <li>Protéger les comptes, enquêter sur les abus et maintenir la sécurité de la plateforme.</li>
        <li>Améliorer le contenu du site, les services et les processus opérationnels.</li>
        <li>Conserver les documents nécessaires à des fins juridiques, fiscales, comptables et de litige.</li>
      </ul>
    </section>

    <section class="policy-section" id="lawful-bases">
      <h2>5. Bases juridiques de l’utilisation des informations</h2>
      <p>Selon la situation, AnyBike peut s’appuyer sur une ou plusieurs des bases juridiques suivantes :</p>
      <div class="policy-table-wrap">
        <table class="policy-table">
          <thead><tr><th>Base juridique</th><th>Quand elle peut s’appliquer</th></tr></thead>
          <tbody>
            <tr><td><strong>Contrat</strong></td><td>Lorsque les informations sont nécessaires pour créer ou gérer un compte, répondre à un service demandé, organiser un achat, une vente, un enlèvement ou une livraison, ou prendre les mesures demandées avant la conclusion d’un contrat.</td></tr>
            <tr><td><strong>Intérêts légitimes</strong></td><td>Pour exploiter et améliorer AnyBike, répondre aux demandes professionnelles, rapprocher le stock de la demande acheteur, prévenir la fraude, protéger la plateforme et conserver des dossiers commerciaux appropriés.</td></tr>
            <tr><td><strong>Obligation légale</strong></td><td>Pour respecter les obligations juridiques, comptables, fiscales, réglementaires, de maintien des registres ou les demandes des autorités compétentes.</td></tr>
            <tr><td><strong>Consentement</strong></td><td>Lorsque votre consentement est demandé spécifiquement, notamment pour certaines communications marketing facultatives ou technologies non essentielles. Le consentement peut être retiré à tout moment.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="policy-section" id="sharing">
      <h2>6. Avec qui nous pouvons partager les informations</h2>
      <p>AnyBike peut partager des informations pertinentes uniquement lorsque cela est raisonnablement nécessaire avec :</p>
      <ul>
        <li>Supabase, qui fournit l’infrastructure de base de données et d’authentification.</li>
        <li>Les prestataires d’hébergement, logiciels, sécurité et services techniques.</li>
        <li>Les vendeurs, concessionnaires ou acheteurs impliqués dans une transaction demandée.</li>
        <li>Les prestataires d’enlèvement, transport, logistique, transit, port et expédition.</li>
        <li>Les prestataires d’inspection, préparation, mise en caisse ou documentation.</li>
        <li>Les conseillers professionnels, assureurs, comptables et juristes.</li>
        <li>Les autorités publiques lorsque la divulgation est requise ou autorisée par la loi.</li>
        <li>Un acheteur, investisseur ou conseiller impliqué dans une vente ou restructuration légitime de l’entreprise.</li>
      </ul>
      <p>Nous ne vendons pas les informations personnelles à des tiers.</p>
      <p>Lorsque des informations sont partagées avec un partenaire opérationnel, AnyBike cherche à ne fournir que les informations nécessaires au service concerné.</p>
    </section>

    <section class="policy-section" id="international">
      <h2>7. Traitement et transferts internationaux</h2>
      <p>AnyBike travaille avec des clients, acheteurs, concessionnaires et prestataires logistiques dans le monde entier. Les informations personnelles peuvent donc être consultées ou partagées en dehors du Royaume-Uni lorsque cela est nécessaire pour fournir un service demandé.</p>
      <p>Certains fournisseurs technologiques peuvent également traiter les informations dans plusieurs pays. Lorsque cela est requis, AnyBike utilise des garanties contractuelles ou juridiques appropriées pour les transferts internationaux.</p>
    </section>

    <section class="policy-section" id="retention">
      <h2>8. Durée de conservation des informations</h2>
      <p>AnyBike conserve les informations personnelles uniquement pendant la durée raisonnablement nécessaire à la finalité pour laquelle elles ont été collectées, notamment pour le service client, les transactions, la sécurité, les obligations juridiques, fiscales, comptables et la résolution des litiges.</p>
      <p>À titre indicatif :</p>
      <ul>
        <li>Les informations de compte peuvent être conservées tant que le compte reste actif et pendant une période raisonnable après sa fermeture.</li>
        <li>Les demandes et messages peuvent être conservés pour le suivi, le service client, les litiges et les dossiers commerciaux.</li>
        <li>Les dossiers de transaction et financiers peuvent être conservés pendant la durée exigée par la législation fiscale et comptable applicable.</li>
        <li>Les prospects inactifs ou non convertis peuvent être examinés puis supprimés ou anonymisés lorsqu’ils ne sont plus nécessaires.</li>
        <li>Les journaux de sécurité peuvent être conservés pendant une durée raisonnable afin d’enquêter sur les abus et protéger la plateforme.</li>
      </ul>
      <p>Les durées de conservation peuvent être prolongées lorsque les informations sont nécessaires dans le cadre d’une action en justice, d’une enquête ou d’une obligation réglementaire.</p>
    </section>

    <section class="policy-section" id="security">
      <h2>9. Comment nous protégeons les informations</h2>
      <p>AnyBike utilise des mesures techniques et organisationnelles raisonnables destinées à protéger les informations personnelles, notamment l’authentification des comptes, les contrôles d’accès, les pages d’administration restreintes, les politiques de sécurité de la base de données et les connexions réseau chiffrées.</p>
      <p>Aucun système Internet ou de stockage ne peut être garanti comme totalement sécurisé. Les clients doivent utiliser un mot de passe fort et unique et ne pas partager leurs identifiants.</p>
      <div class="notice">Si vous pensez que votre compte ou vos informations personnelles ont été compromis, contactez rapidement <strong>sales@anybike.co.uk</strong>.</div>
    </section>

    <section class="policy-section" id="cookies">
      <h2>10. Cookies, stockage local et technologies similaires</h2>
      <p>AnyBike peut utiliser le stockage du navigateur, des jetons d’authentification, des cookies ou des technologies similaires pour :</p>
      <ul>
        <li>Maintenir les clients connectés de manière sécurisée.</li>
        <li>Mémoriser les préférences de langue et de devise.</li>
        <li>Maintenir les fonctions de compte et de sécurité.</li>
        <li>Prendre en charge les listes de suivi, recherches enregistrées et fonctions client.</li>
        <li>Comprendre et améliorer les performances du site lorsque cela est autorisé.</li>
      </ul>
      <p>Certains stockages sont nécessaires au fonctionnement du site et des fonctions de compte. Si des cookies non essentiels ou des outils d’analyse sont introduits, AnyBike fournira les contrôles de consentement requis par la loi.</p>
      <p>Les paramètres du navigateur permettent de supprimer ou bloquer les données stockées, mais cela peut vous déconnecter ou empêcher certaines fonctions du site de fonctionner correctement.</p>
    </section>

    <section class="policy-section" id="rights">
      <h2>11. Vos droits en matière de protection des données</h2>
      <p>Selon les circonstances, la législation britannique sur la protection des données peut vous accorder les droits suivants :</p>
      <ul>
        <li>Être informé de la manière dont vos informations sont utilisées.</li>
        <li>Demander l’accès aux informations personnelles détenues à votre sujet.</li>
        <li>Demander la correction d’informations inexactes ou incomplètes.</li>
        <li>Demander la suppression des informations dans certaines circonstances.</li>
        <li>Demander la limitation du traitement dans certaines circonstances.</li>
        <li>Vous opposer à certains traitements, notamment au marketing direct.</li>
        <li>Recevoir certaines informations dans un format portable.</li>
        <li>Retirer votre consentement lorsqu’il constitue la base juridique du traitement.</li>
        <li>Déposer une réclamation concernant la manière dont vos informations ont été traitées.</li>
      </ul>
      <p>Pour exercer un droit, envoyez un e-mail à <strong>sales@anybike.co.uk</strong>. Nous pouvons avoir besoin de confirmer votre identité avant de traiter votre demande.</p>
      <p>Vous avez également le droit de déposer une réclamation auprès de l’Information Commissioner’s Office du Royaume-Uni si vous êtes préoccupé par la manière dont vos informations ont été utilisées.</p>
    </section>

    <section class="policy-section" id="children">
      <h2>12. Enfants</h2>
      <p>Les services AnyBike sont destinés aux adultes et aux entreprises impliqués dans l’achat, la vente, la recherche ou l’exportation de motos. Le site n’a pas vocation à collecter sciemment des informations personnelles concernant des enfants.</p>
      <p>Un parent ou tuteur qui pense qu’un enfant a transmis des informations personnelles doit contacter AnyBike afin que la situation puisse être examinée.</p>
    </section>

    <section class="policy-section" id="changes">
      <h2>13. Modifications de cette politique</h2>
      <p>AnyBike peut mettre à jour cette politique de confidentialité lorsque les services, technologies, fournisseurs ou exigences légales évoluent.</p>
      <p>La dernière version sera publiée sur cette page avec une date de révision mise à jour. Les modifications importantes pourront également être signalées ailleurs sur le site ou communiquées directement lorsque cela est approprié.</p>
    </section>

    <section class="contact-card" id="contact">
      <div>
        <h2>14. Contacter AnyBike au sujet de la confidentialité</h2>
        <p>Envoyez un e-mail à <strong>sales@anybike.co.uk</strong> avec l’objet « Demande de confidentialité » et expliquez ce dont vous avez besoin.</p>
      </div>
      <a class="btn" href="mailto:sales@anybike.co.uk?subject=Privacy%20Request">Envoyer un e-mail à AnyBike</a>
    </section>
  </div>
</div>`;

    if(footer){
      footer.innerHTML=`
        <div class="footer-inner">
          <span>© <span id="year"></span> AnyBike.co.uk</span>
          <div class="footer-links">
            <a href="/privacy-policy.html">Politique de confidentialité</a>
            <a href="/contact-us.html">Contacter AnyBike</a>
            <a href="/customer-register.html">Mon AnyBike</a>
          </div>
        </div>`;
      const y=footer.querySelector("#year"); if(y) y.textContent=new Date().getFullYear();
    }
  }

  function en(){
    main.innerHTML=originalMain;
    if(footer) footer.innerHTML=originalFooter;
    const y=document.getElementById("year"); if(y) y.textContent=new Date().getFullYear();
  }

  function apply(){
    if(currentLang().startsWith("fr")) fr(); else en();
  }

  window.addEventListener("anybikeLanguageChanged",()=>setTimeout(apply,0));
  document.addEventListener("DOMContentLoaded",()=>setTimeout(apply,50));
  setTimeout(apply,100);
})();