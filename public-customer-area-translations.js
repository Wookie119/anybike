/*
AnyBike
File: public-customer-area-translations.js
Purpose: French translation pass for logged-in My AnyBike customer pages
Date: 20 September 2026
*/
(function(){
  const supported=new Set([
    "/customer-dashboard.html",
    "/customer-messages.html",
    "/my-searches.html",
    "/my-watchlist.html",
    "/my-purchases.html",
    "/accounts-documents.html"
  ]);
  const path=String(location.pathname||"").toLowerCase();
  if(!supported.has(path)) return;

  const fr={
    "Customer Workspace":"Espace client",
    "My":"Mon",
    "AnyBike":"AnyBike",
    "Loading your personalised AnyBike workspace...":"Chargement de votre espace AnyBike personnalisé...",
    "Watchlist":"Favoris",
    "Bikes":"Motos",
    "Saved":"Enregistrées",
    "Searches":"Recherches",
    "Available":"Disponibles",
    "Motorcycles":"Motos",
    "Potential":"Correspondances",
    "Matches":"potentielles",
    "Pending":"En attente",
    "Offers":"Offres",
    "New":"Nouveaux",
    "Messages":"Messages",

    "🤝 My Offers":"🤝 Mes offres",
    "Formal AnyBike offers waiting for your decision. Offer expiry is separate from seller availability or any motorcycle hold.":"Offres formelles AnyBike en attente de votre décision. La date d’expiration de l’offre est distincte de la disponibilité du vendeur ou de toute mise en attente de la moto.",
    "Loading your AnyBike offers...":"Chargement de vos offres AnyBike...",
    "🛒 My Purchases":"🛒 Mes achats",
    "Motorcycles where you have accepted a formal AnyBike offer. Track your purchase, deposit and motorcycle security status here.":"Motos pour lesquelles vous avez accepté une offre formelle AnyBike. Suivez ici votre achat, votre acompte et le statut de sécurisation de la moto.",
    "Accounts & Documents →":"Comptes & documents →",
    "Loading your AnyBike purchases...":"Chargement de vos achats AnyBike...",
    "📄 Accounts & Documents":"📄 Comptes & documents",
    "Your Proformas, invoices, payment history and motorcycle documents are kept together in one central area.":"Vos proformas, factures, historique de paiement et documents moto sont regroupés dans un espace central.",
    "Open Accounts & Documents →":"Ouvrir Comptes & documents →",
    "Proformas & Invoices":"Proformas & factures",
    "Payments & Payment Advice":"Paiements & avis de paiement",
    "Motorcycle Documents":"Documents moto",
    "My Other Documents":"Mes autres documents",

    "🏍️ Your AnyBike Potential Matches":"🏍️ Vos correspondances AnyBike potentielles",
    "Motorcycles selected by AnyBike against your buying requirements. These are provisional opportunities until availability and final pricing are confirmed.":"Motos sélectionnées par AnyBike selon vos critères d’achat. Il s’agit d’opportunités provisoires jusqu’à confirmation de la disponibilité et du prix final.",
    "Match alerts":"Alertes de correspondance",
    "Real-time":"Temps réel",
    "Daily digest":"Résumé quotidien",
    "Weekly digest":"Résumé hebdomadaire",
    "Dashboard only":"Tableau de bord uniquement",
    "Loading your AnyBike Potential Matches...":"Chargement de vos correspondances AnyBike potentielles...",

    "⭐ Recommended For You":"⭐ Recommandé pour vous",
    "Based on the motorcycle searches you have saved in My AnyBike.":"Basé sur les recherches moto enregistrées dans Mon AnyBike.",
    "Browse all stock →":"Voir tout le stock →",
    "Show More Recommendations":"Afficher plus de recommandations",

    "🚢 Saved Shipping Preferences":"🚢 Préférences d’expédition enregistrées",
    "Keep more than one UK handover / freight-forwarder option. You can choose the right shipper for each AnyBike purchase.":"Conservez plusieurs options de remise au Royaume-Uni / transitaire. Vous pourrez choisir le bon transporteur pour chaque achat AnyBike.",
    "Set up your shipping before you buy":"Préparez votre expédition avant l’achat",
    "Spending a few minutes saving the freight forwarders you may use can save time later when you accept an AnyBike offer. We recommend contacting the shipper directly to discuss your motorcycle, destination and requirements, then saving the name, telephone number, extension and email address of the person handling your enquiry. You can also record useful details such as sailing days, container loading deadlines and special instructions.":"Prendre quelques minutes pour enregistrer les transitaires que vous pourriez utiliser peut vous faire gagner du temps lorsque vous acceptez une offre AnyBike. Nous vous recommandons de contacter directement le transporteur pour discuter de votre moto, de la destination et de vos besoins, puis d’enregistrer le nom, le numéro de téléphone, le poste et l’adresse e-mail de la personne qui suit votre demande. Vous pouvez également noter les jours de départ, les délais de chargement du conteneur et les instructions particulières.",
    "Research Freight Forwarders ↗":"Rechercher des transitaires ↗",
    "Choose From Directory":"Choisir dans l’annuaire",
    "What should I ask the shipper?":"Que demander au transporteur ?",
    "Before saving a shipper, contact them directly and discuss your motorcycle, destination and shipping requirements. Useful questions include:":"Avant d’enregistrer un transporteur, contactez-le directement et discutez de votre moto, de la destination et de vos besoins d’expédition. Questions utiles :",
    "Can you handle this motorcycle and destination?":"Pouvez-vous prendre en charge cette moto et cette destination ?",
    "Which UK port or handover point should AnyBike deliver to?":"Dans quel port ou point de remise au Royaume-Uni AnyBike doit-il livrer ?",
    "Who will be the named contact for this shipment?":"Qui sera le contact désigné pour cette expédition ?",
    "What telephone number and extension should AnyBike use?":"Quel numéro de téléphone et quel poste AnyBike doit-il utiliser ?",
    "What email address should documents be sent to?":"À quelle adresse e-mail les documents doivent-ils être envoyés ?",
    "Is there a quote, booking, account or customer reference we should use?":"Y a-t-il une référence de devis, réservation, compte ou client à utiliser ?",
    "What day does the vessel normally depart?":"Quel jour le navire part-il habituellement ?",
    "When must the motorcycle or container arrive or be loaded?":"Quand la moto ou le conteneur doit-il arriver ou être chargé ?",
    "Are there any fuel, battery, size, crating or preparation requirements?":"Y a-t-il des exigences concernant le carburant, la batterie, les dimensions, la mise en caisse ou la préparation ?",
    "Which documents do you need from AnyBike before handover?":"Quels documents avez-vous besoin de recevoir d’AnyBike avant la remise ?",
    "Are there any booking, loading or documentation deadlines we should know about?":"Y a-t-il des délais de réservation, chargement ou documentation à connaître ?",
    "Tip:":"Conseil :",
    "Save the answers in your Shipping Preferences so you do not need to collect them again for every motorcycle.":"Enregistrez les réponses dans vos préférences d’expédition afin de ne pas devoir les recueillir à nouveau pour chaque moto.",
    "Choose from AnyBike's Freight Forwarder Directory":"Choisir dans l’annuaire des transitaires AnyBike",
    "Select one or more companies you may want to use. They will be added to your saved shipping preferences so you can complete your own contact and handover details.":"Sélectionnez une ou plusieurs sociétés que vous pourriez utiliser. Elles seront ajoutées à vos préférences d’expédition afin que vous puissiez compléter vos propres coordonnées et détails de remise.",
    "Independent directory":"Annuaire indépendant",
    "Visit provider website ↗":"Voir le site du prestataire ↗",
    "Add Selected Providers":"Ajouter les prestataires sélectionnés",
    "Clear Selection":"Effacer la sélection",
    "Directory listings are for research and comparison. Inclusion is not an endorsement, recommendation or guarantee by AnyBike. Always obtain a current written quotation and confirm services for your motorcycle and destination directly with the provider.":"Les entreprises de l’annuaire sont présentées à des fins de recherche et de comparaison. Leur présence ne constitue ni une approbation, ni une recommandation, ni une garantie d’AnyBike. Demandez toujours un devis écrit à jour et confirmez directement avec le prestataire les services pour votre moto et votre destination.",
    "Loading your saved shipping preferences...":"Chargement de vos préférences d’expédition...",
    "Preference Name":"Nom de la préférence",
    "UK Port / Handover Point":"Port UK / point de remise",
    "Freight Forwarder / Shipper":"Transitaire / transporteur",
    "Forwarder Contact Name":"Nom du contact",
    "Forwarder Telephone":"Téléphone du transitaire",
    "Extension":"Poste",
    "Forwarder Email Address":"E-mail du transitaire",
    "Account / Quote / Booking Reference":"Référence compte / devis / réservation",
    "Shipping Notes":"Notes d’expédition",
    "Make this my default shipping preference":"Définir comme préférence d’expédition par défaut",
    "Add Shipping Preference":"Ajouter une préférence d’expédition",
    "Saved preferences are reusable contact details only. Choosing one for a purchase does not confirm a booking or authorise AnyBike to buy the motorcycle; AnyBike must verify the UK Handover Plan first.":"Les préférences enregistrées sont uniquement des coordonnées réutilisables. En choisir une pour un achat ne confirme pas une réservation et n’autorise pas AnyBike à acheter la moto ; AnyBike doit d’abord vérifier le plan de remise au Royaume-Uni.",

    "👀 Recently Viewed":"👀 Consultées récemment",
    "Continue where you left off.":"Reprenez là où vous vous étiez arrêté.",

    "Create New Message":"Créer un nouveau message",
    "Send a new question directly to the AnyBike team.":"Envoyez une nouvelle question directement à l’équipe AnyBike.",
    "What can we help you with?":"Comment pouvons-nous vous aider ?",
    "Choose a subject":"Choisir un sujet",
    "🏍 I am looking for a motorcycle":"🏍 Je recherche une moto",
    "🌍 Global Buyer Network enquiry":"🌍 Demande Global Buyer Network",
    "📦 Existing order":"📦 Commande existante",
    "🚢 Shipping or export question":"🚢 Question sur le transport ou l’export",
    "💷 Sell my motorcycle":"💷 Vendre ma moto",
    "❤️ Question about a saved bike":"❤️ Question sur une moto enregistrée",
    "⭐ Question about my watchlist":"⭐ Question sur mes favoris",
    "🔎 Saved search enquiry":"🔎 Question sur une recherche enregistrée",
    "🌐 Question about a page on the website":"🌐 Question sur une page du site",
    "💳 Payment or invoice":"💳 Paiement ou facture",
    "👤 My account":"👤 Mon compte",
    "❓ General question":"❓ Question générale",
    "📞 Other":"📞 Autre",
    "Message title":"Titre du message",
    "Related page":"Page concernée",
    "My AnyBike customer workspace":"Espace client Mon AnyBike",
    "Message":"Message",
    "Cancel":"Annuler",
    "Send Message":"Envoyer le message",
    "My AnyBike Offer":"Mon offre AnyBike",
    "AnyBike Offer":"Offre AnyBike",

    "My AnyBike":"Mon AnyBike",
    "My Messages":"Mes messages",
    "Loading your AnyBike conversations...":"Chargement de vos conversations AnyBike...",
    "conversations":"conversations",
    "← My AnyBike":"← Mon AnyBike",
    "💬 New Message":"💬 Nouveau message",
    "💬 Enquiries & Messages":"💬 Demandes & messages",
    "Open a conversation to read and reply to AnyBike.":"Ouvrez une conversation pour lire et répondre à AnyBike.",
    "📧 When we reply, we'll also send you an email notification. Please check your Junk or Spam folder if you don't see it.":"📧 Lorsque nous répondons, nous vous envoyons également une notification par e-mail. Vérifiez votre dossier Indésirables ou Spam si vous ne la voyez pas.",
    "Loading conversations...":"Chargement des conversations...",

    "My Buying Requirements":"Mes critères d’achat",
    "My Buying":"Mes critères",
    "Requirements":"d’achat",
    "Tell AnyBike what motorcycles you want to buy. We will use your requirements to match suitable authorised stock and alert you when relevant opportunities become available.":"Indiquez à AnyBike les motos que vous souhaitez acheter. Nous utiliserons vos critères pour rechercher du stock autorisé adapté et vous alerter lorsque des opportunités pertinentes seront disponibles.",
    "Create Buying Requirement":"Créer un critère d’achat",
    "UK trade buying is demand-led.":"Les achats professionnels UK sont guidés par la demande.",
    "Save the motorcycles you want to buy and AnyBike can match suitable authorised stock as it becomes available. Where a commercially viable opportunity exists, AnyBike can send you a private AnyBike Offer.":"Enregistrez les motos que vous souhaitez acheter et AnyBike pourra les faire correspondre au stock autorisé disponible. Lorsqu’une opportunité commercialement viable existe, AnyBike peut vous envoyer une offre privée.",
    "Make":"Marque",
    "Any Make":"Toutes les marques",
    "Model":"Modèle",
    "Any Model":"Tous les modèles",
    "Variant":"Variante",
    "Maximum mileage":"Kilométrage maximum",
    "Minimum year":"Année minimum",
    "Maximum year":"Année maximum",
    "Maximum buying budget £":"Budget d’achat maximum £",
    "Quantity wanted":"Quantité souhaitée",
    "Buying frequency":"Fréquence d’achat",
    "One-off purchase":"Achat ponctuel",
    "Occasional":"Occasionnel",
    "Monthly":"Mensuel",
    "Weekly / regular stock":"Hebdomadaire / stock régulier",
    "Ongoing requirement":"Besoin permanent",
    "Buying for":"Achat pour",
    "United Kingdom":"Royaume-Uni",
    "International / Export":"International / Export",
    "Additional requirement notes":"Notes supplémentaires",
    "Save Buying Requirement":"Enregistrer le critère d’achat",
    "Loading...":"Chargement...",

    "My Watchlist":"Mes favoris",
    "My Watchlist":"Mes favoris",
    "Your saved motorcycles. Use this page to review bikes you are interested in and contact AnyBike when ready.":"Vos motos enregistrées. Utilisez cette page pour revoir les motos qui vous intéressent et contacter AnyBike lorsque vous êtes prêt.",
    "Loading your watchlist...":"Chargement de vos favoris...",
    "Currency":"Devise",

    "MY ANYBIKE":"MON ANYBIKE",
    "Your accepted AnyBike purchases, payment progress and motorcycle security status in one place.":"Vos achats AnyBike acceptés, l’avancement des paiements et le statut de sécurisation des motos en un seul endroit.",
    "← Back to My AnyBike":"← Retour à Mon AnyBike",
    "Loading your purchases...":"Chargement de vos achats...",

    "Accounts & Documents":"Comptes & documents",
    "Your central AnyBike area for Proformas, invoices, payments and documents held against your motorcycles and customer account.":"Votre espace central AnyBike pour les proformas, factures, paiements et documents liés à vos motos et à votre compte client.",
    "My Purchases":"Mes achats",
    "Issued Documents":"Documents émis",
    "Outstanding":"En attente",
    "Payment Advice Pending":"Avis de paiement en attente",
    "Verified / Posted":"Vérifié / comptabilisé",
    "Select one or more outstanding issued documents below if you have made a bank transfer.":"Sélectionnez ci-dessous un ou plusieurs documents émis en attente si vous avez effectué un virement bancaire.",
    "Important:":"Important :",
    "reporting a payment tells AnyBike what you have sent and how you want it allocated. It does not mark the money as received until AnyBike verifies the transfer in its bank account.":"signaler un paiement indique à AnyBike ce que vous avez envoyé et comment vous souhaitez l’affecter. Le paiement n’est pas considéré comme reçu tant qu’AnyBike n’a pas vérifié le virement sur son compte bancaire.",
    "Loading your invoices...":"Chargement de vos factures...",
    "I’ve Made a Bank Transfer":"J’ai effectué un virement bancaire",
    "Confirm the transfer details and the split you selected above.":"Confirmez les détails du virement et la répartition sélectionnée ci-dessus.",
    "Payment date":"Date du paiement",
    "Bank transfer reference":"Référence du virement",
    "Payment method":"Mode de paiement",
    "Notes (optional)":"Notes (facultatif)",
    "Total you are reporting":"Total déclaré",
    "The selected allocations must add up exactly to the bank transfer you made. AnyBike will verify the actual bank receipt before your purchase balance is updated.":"Les affectations sélectionnées doivent correspondre exactement au montant du virement effectué. AnyBike vérifiera la réception réelle des fonds avant la mise à jour du solde de votre achat.",
    "Submit Payment Advice":"Envoyer l’avis de paiement",
    "Payment Advice History":"Historique des avis de paiement",
    "Payments you have reported to AnyBike and their verification/posting status.":"Paiements que vous avez signalés à AnyBike et leur statut de vérification/comptabilisation.",
    "Loading payment history...":"Chargement de l’historique des paiements...",
    "Documents AnyBike has specifically shared with you for your motorcycles and Deals, such as inspection, HPI/history, shipping and export paperwork.":"Documents qu’AnyBike a spécifiquement partagés avec vous pour vos motos et dossiers, tels que l’inspection, l’historique/HPI, le transport et les documents d’export.",
    "Loading motorcycle documents...":"Chargement des documents moto...",
    "Customer-level files held in your AnyBike account.":"Fichiers au niveau du compte client conservés dans votre compte AnyBike.",
    "Loading documents...":"Chargement des documents...",

    "UK Motorcycle Export Specialists — Worldwide sourcing and export services.":"Spécialistes britanniques de l’export moto — recherche et services d’export dans le monde entier.",
    "International Retail • International Trade • UK Trade — Motorcycles bought and sold by AnyBike.":"Vente internationale • Commerce international • Commerce UK — Motos achetées et vendues par AnyBike."
  };

  function currentLanguage(){
    return String(localStorage.getItem("anybikeLanguage")||localStorage.getItem("anybike_language")||document.documentElement.lang||"en").toLowerCase();
  }

  function translateAttributes(){
    if(!currentLanguage().startsWith("fr")) return;
    const attrs={
      placeholder:{
        "Message title":"Titre du message",
        "Related page":"Page concernée",
        "Message":"Message",
        "Preference Name":"Nom de la préférence",
        "UK Port / Handover Point":"Port UK / point de remise",
        "Freight Forwarder / Shipper":"Transitaire / transporteur",
        "Forwarder Contact Name":"Nom du contact",
        "Forwarder Telephone":"Téléphone du transitaire",
        "Extension":"Poste",
        "Forwarder Email Address":"E-mail du transitaire",
        "Account / Quote / Booking Reference":"Référence compte / devis / réservation",
        "Shipping Notes":"Notes d’expédition",
        "Variant":"Variante",
        "Maximum mileage":"Kilométrage maximum",
        "Minimum year":"Année minimum",
        "Maximum year":"Année maximum",
        "Additional requirement notes":"Notes supplémentaires",
        "Bank transfer reference":"Référence du virement",
        "Notes (optional)":"Notes (facultatif)"
      }
    };
    document.querySelectorAll("[placeholder]").forEach(el=>{
      const p=el.getAttribute("placeholder");
      if(attrs.placeholder[p]) el.setAttribute("placeholder",attrs.placeholder[p]);
    });
  }

  let scheduled=false;
  function apply(){
    scheduled=false;
    if(!currentLanguage().startsWith("fr")) return;
    const root=document.querySelector("main")||document.body;
    root.querySelectorAll("*").forEach(el=>{
      if(el.children.length) return;
      const key=String(el.textContent||"").replace(/\s+/g," ").trim();
      const translated=fr[key];
      if(translated && translated!==key) el.textContent=translated;
    });
    translateAttributes();
    document.documentElement.lang="fr";
  }
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(apply);
  }

  document.addEventListener("DOMContentLoaded",()=>setTimeout(schedule,40));
  window.addEventListener("anybikeLanguageChanged",()=>setTimeout(schedule,0));
  const target=document.querySelector("main")||document.body;
  if(target){
    const observer=new MutationObserver(schedule);
    observer.observe(target,{childList:true,subtree:true});
  }
  setTimeout(schedule,120);
})();