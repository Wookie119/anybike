/*
AnyBike
File: services-fees-fr-full.js
Purpose: Complete French pass for services-and-fees.html
Date: 20 September 2026
*/
(function(){
  if(location.pathname!=="/services-and-fees.html") return;

  const map={
    "AnyBike Services & Fees":"Services & frais AnyBike",
    "Clear costs before work begins.":"Des coûts clairs avant le début du travail.",
    "Sourcing, inspection, UK collection, export preparation and shipping support — with AnyBike charges and third-party costs shown separately where practical.":"Recherche, inspection, enlèvement au Royaume-Uni, préparation à l’export et assistance transport — avec les frais AnyBike et les coûts tiers présentés séparément lorsque possible.",
    "Start an Enquiry":"Commencer une demande",
    "View Export Services":"Voir les services export",
    "Before you commit":"Avant de vous engager",
    "AnyBike confirms the scope, applicable service fee and known third-party charges before paid work begins.":"AnyBike confirme le périmètre, les frais de service applicables et les coûts tiers connus avant le début de tout travail payant.",
    "Motorcycle price, freight, duties, taxes, registration and destination-country costs are separate unless specifically stated as included.":"Le prix de la moto, le fret, les droits, taxes, immatriculation et frais dans le pays de destination sont séparés sauf mention explicite de leur inclusion.",
    "Fee Summary":"Résumé des frais","Buyer Fee":"Frais acheteur","Inspection":"Inspection","Transport & Export":"Transport & export","Admin & Storage":"Administration & stockage","International Markets":"Marchés internationaux",
    "At a glance":"En un coup d’œil","Service fee summary":"Résumé des frais de service",
    "Final charges depend on the motorcycle, location, destination and agreed scope. AnyBike confirms the applicable amount before chargeable work begins.":"Les frais finaux dépendent de la moto, de son emplacement, de la destination et du périmètre convenu. AnyBike confirme le montant applicable avant le début de tout travail facturable.",
    "Service":"Service","How it is charged":"Mode de facturation","More information":"Plus d’informations",
    "AnyBike Buyer Fee":"Frais acheteur AnyBike",
    "For international buyers using AnyBike to source, secure and purchase a motorcycle from the UK.":"Pour les acheteurs internationaux utilisant AnyBike pour rechercher, sécuriser et acheter une moto au Royaume-Uni.",
    "From £395":"À partir de 395 £","View Buyer Fees →":"Voir les frais acheteur →",
    "Collection Inspection":"Inspection lors de l’enlèvement",
    "Visual collection check with up to 10 current photographs sent to the buyer via WhatsApp.":"Contrôle visuel lors de l’enlèvement avec jusqu’à 10 photos récentes envoyées à l’acheteur via WhatsApp.",
    "From £95":"À partir de 95 £","View inspection details →":"Voir les détails de l’inspection →",
    "International buyer collection & port delivery":"Enlèvement acheteur international & livraison au port",
    "Standard UK mainland collection and delivery to an agreed UK port or handover point.":"Enlèvement standard en Grande-Bretagne continentale et livraison vers un port britannique ou point de remise convenu.",
    "£349 inc. VAT":"349 £ TTC","View transport details →":"Voir les détails du transport →",
    "Export crating / packing":"Mise en caisse / emballage export","Specialist third-party packing where required.":"Emballage spécialisé par un tiers lorsque nécessaire.","Third-party quotation":"Devis tiers","Export crating →":"Mise en caisse export →",
    "Shipping support":"Assistance transport","UK-side handover and freight coordination.":"Remise au Royaume-Uni et coordination du fret.","Quoted if applicable":"Sur devis si applicable","Shipping advice →":"Conseils transport →",
    "Depot storage":"Stockage au dépôt","Where a motorcycle is held at the AnyBike depot before onward movement.":"Lorsqu’une moto est conservée au dépôt AnyBike avant son acheminement suivant.","£6.95 per bike / day inc. VAT":"6,95 £ par moto / jour TTC","View additional services →":"Voir les services supplémentaires →",
    "Fees shown on this page describe how charges are applied. Third-party costs are confirmed separately where applicable and may vary by location, provider, motorcycle and destination.":"Les frais affichés sur cette page expliquent comment les coûts sont appliqués. Les coûts tiers sont confirmés séparément lorsqu’ils s’appliquent et peuvent varier selon l’emplacement, le prestataire, la moto et la destination.",
    "How charges work":"Comment fonctionnent les frais","AnyBike fee or third-party cost?":"Frais AnyBike ou coût tiers ?",
    "AnyBike charges relate to services we provide or coordinate. Transport, specialist packing, freight, storage and some inspections may involve an external provider. We separate those costs wherever practical so the quotation is clear.":"Les frais AnyBike concernent les services que nous fournissons ou coordonnons. Le transport, l’emballage spécialisé, le fret, le stockage et certaines inspections peuvent faire intervenir un prestataire externe. Nous séparons ces coûts lorsque possible afin que le devis soit clair.",
    "AnyBike fee":"Frais AnyBike","Our service charge":"Nos frais de service","Sourcing, coordination, administration or another agreed service carried out by AnyBike.":"Recherche, coordination, administration ou autre service convenu réalisé par AnyBike.",
    "Third-party cost":"Coût tiers","External provider charge":"Frais d’un prestataire externe","Transport, packing, freight, storage or other specialist costs included in or added to the agreed quotation.":"Transport, emballage, fret, stockage ou autres coûts spécialisés inclus dans le devis convenu ou ajoutés à celui-ci.",
    "A clear Buyer Fee based on the motorcycle price.":"Des frais acheteur clairs basés sur le prix de la moto.",
    "The Buyer Fee covers AnyBike's work in sourcing or securing the motorcycle, managing the seller or dealer relationship, managing the purchase and moving the transaction into the AnyBike buying and operations process.":"Les frais acheteur couvrent le travail d’AnyBike pour rechercher ou sécuriser la moto, gérer la relation avec le vendeur ou le concessionnaire, gérer l’achat et faire passer la transaction dans le processus d’achat et d’opérations AnyBike.",
    "International buyers":"Acheteurs internationaux","Buyer Fees apply to international motorcycle purchases.":"Les frais acheteur s’appliquent aux achats internationaux de motos.",
    "These fees apply where an international buyer uses AnyBike to source, secure and purchase a motorcycle from the UK.":"Ces frais s’appliquent lorsqu’un acheteur international utilise AnyBike pour rechercher, sécuriser et acheter une moto au Royaume-Uni.",
    "UK trade buyers":"Acheteurs professionnels UK","No standard Buyer Fee.":"Aucun frais acheteur standard.","Standard UK trade motorcycles are sold at the agreed AnyBike trade price. Delivery and any specifically requested additional services may be charged separately.":"Les motos destinées au commerce UK sont vendues au prix professionnel AnyBike convenu. La livraison et tout service supplémentaire demandé spécifiquement peuvent être facturés séparément.",
    "Motorcycle price":"Prix de la moto","Up to £2,999":"Jusqu’à 2 999 £","From £1,695 — confirmed before purchase":"À partir de 1 695 £ — confirmé avant l’achat","Buyer Fees shown include VAT where applicable.":"Les frais acheteur affichés incluent la TVA lorsqu’elle s’applique.",
    "Included in the Buyer Fee":"Inclus dans les frais acheteur",
    "Sourcing or securing the motorcycle":"Recherche ou sécurisation de la moto",
    "Managing the seller or dealer relationship":"Gestion de la relation avec le vendeur ou concessionnaire",
    "Checking availability and agreed motorcycle details":"Vérification de la disponibilité et des informations convenues sur la moto",
    "Negotiating purchase terms where possible":"Négociation des conditions d’achat lorsque possible",
    "Managing the AnyBike purchase":"Gestion de l’achat AnyBike",
    "Customer communication through the buying process":"Communication avec le client pendant le processus d’achat",
    "Setting the deal up through Deal 360 / operations":"Mise en place de l’affaire dans Deal 360 / opérations",
    "Standard transaction administration":"Administration standard de la transaction",
    "Charged separately where applicable":"Facturé séparément si applicable",
    "Motorcycle purchase price":"Prix d’achat de la moto","UK collection / delivery":"Enlèvement / livraison UK","International freight":"Fret international","Storage":"Stockage","Destination taxes, duties and registration":"Taxes, droits et immatriculation à destination","Unusual or additional document / admin work":"Travail documentaire / administratif inhabituel ou supplémentaire",
    "Selling or supplying a motorcycle to AnyBike is currently free.":"Vendre ou fournir une moto à AnyBike est actuellement gratuit.",
    "There are no seller-side listing or transaction fees at present. The buyer pays the applicable AnyBike Buyer Fee. Any future dealer membership or subscription services would be separate.":"Il n’y a actuellement aucun frais d’annonce ou de transaction côté vendeur. L’acheteur paie les frais acheteur AnyBike applicables. Toute future adhésion professionnelle ou service d’abonnement serait facturé séparément.",
    "Visual collection check — from £95.":"Contrôle visuel lors de l’enlèvement — à partir de 95 £.",
    "Add a Collection Inspection when you accept the AnyBike offer. The inspection charge is added to the initial £250 motorcycle deposit together with any other optional services selected at that stage.":"Ajoutez une inspection lors de l’enlèvement lorsque vous acceptez l’offre AnyBike. Le coût de l’inspection est ajouté à l’acompte initial de 250 £ avec les autres services optionnels choisis à ce stade.",
    "View Motorcycle Inspection →":"Voir l’inspection moto →",
    "Visual condition check by the collecting driver, basic confirmation that the motorcycle matches the agreed details, and up to 10 current photographs sent to the buyer via WhatsApp.":"Contrôle visuel par le chauffeur lors de l’enlèvement, confirmation de base que la moto correspond aux informations convenues et jusqu’à 10 photos récentes envoyées à l’acheteur via WhatsApp.",
    "Enhanced / specialist inspection":"Inspection approfondie / spécialisée",
    "Workshop, mechanical, diagnostic, road-test or other specialist inspection requirements.":"Besoins d’inspection en atelier, mécanique, diagnostic, essai routier ou autre expertise spécialisée.",
    "Quoted separately":"Devis séparé",
    "Full payment must be received before AnyBike collects the motorcycle from the seller.":"Le paiement intégral doit être reçu avant qu’AnyBike n’enlève la moto chez le vendeur.",
    "The Collection Inspection is a visual collection check only and is not a mechanical inspection, diagnostic test or warranty. If the driver identifies a serious undisclosed discrepancy before loading, the issue is referred to AnyBike for review before collection proceeds.":"L’inspection lors de l’enlèvement est uniquement un contrôle visuel et ne constitue ni une inspection mécanique, ni un diagnostic, ni une garantie. Si le chauffeur identifie une anomalie importante non déclarée avant le chargement, le problème est transmis à AnyBike pour examen avant la poursuite de l’enlèvement.",
    "Transport & export services":"Services transport & export","Collection, port delivery, crating and shipping support.":"Enlèvement, livraison au port, mise en caisse et assistance transport.",
    "For international buyers, AnyBike can coordinate the UK-side movement of the motorcycle from the seller to an agreed UK port, handover point, depot, export packer or freight forwarder.":"Pour les acheteurs internationaux, AnyBike peut coordonner le transport de la moto au Royaume-Uni depuis le vendeur vers un port, point de remise, dépôt, emballeur export ou transitaire convenu.",
    "International buyer collection":"Enlèvement acheteur international","Seller collection & port delivery":"Enlèvement chez le vendeur & livraison au port",
    "Standard UK mainland motorcycle collection from the seller, dealer or auction and delivery to an agreed UK port or handover point.":"Enlèvement standard d’une moto en Grande-Bretagne continentale auprès du vendeur, concessionnaire ou site d’enchères, puis livraison au port ou point de remise UK convenu.",
    "Motorcycle Collection →":"Enlèvement moto →",
    "Export crating":"Mise en caisse export","Export crating & packing coordination":"Coordination mise en caisse & emballage export","AnyBike can arrange handover to an experienced third-party packing provider where crating or specialist export packing is required.":"AnyBike peut organiser la remise à un prestataire tiers expérimenté lorsqu’une mise en caisse ou un emballage export spécialisé est nécessaire.","Export Crating →":"Mise en caisse export →",
    "Planning the UK side of international shipping":"Organisation de la partie britannique du transport international","We can coordinate ports, depots, packing requirements and freight-forwarder instructions. Buyers may nominate their own shipper.":"Nous pouvons coordonner ports, dépôts, exigences d’emballage et instructions du transitaire. Les acheteurs peuvent désigner leur propre transporteur.","Shipping Advice →":"Conseils transport →","International Markets →":"Marchés internationaux →",
    "The £349 rate is intended for standard UK mainland motorcycle movements. Remote locations, islands, unusual access, non-running motorcycles, specialist loading or additional movements may require a separate quotation. Import duty, tax, compliance, registration and destination-country charges are not included unless specifically stated in writing.":"Le tarif de 349 £ concerne les transports standard de motos en Grande-Bretagne continentale. Les zones isolées, îles, accès difficiles, motos non roulantes, chargements spécialisés ou mouvements supplémentaires peuvent nécessiter un devis séparé. Les droits d’importation, taxes, conformité, immatriculation et frais du pays de destination ne sont pas inclus sauf mention écrite explicite.",
    "Additional services":"Services supplémentaires","Administration, storage and non-standard requirements.":"Administration, stockage et besoins non standards.","Most transactions follow the standard AnyBike process. Additional charges only arise where extra work, waiting time, storage or special arrangements are required.":"La plupart des transactions suivent le processus standard AnyBike. Des frais supplémentaires ne s’appliquent que si un travail supplémentaire, un temps d’attente, du stockage ou des dispositions particulières sont nécessaires.",
    "Standard transaction documents":"Documents standards de transaction","Normal documents included with an AnyBike purchase.":"Documents habituels inclus avec un achat AnyBike.","Included where stated":"Inclus lorsqu’indiqué",
    "Additional document / admin work":"Travail documentaire / administratif supplémentaire","Replacement paperwork or other non-standard work requested outside the normal transaction process.":"Documents de remplacement ou autre travail non standard demandé en dehors du processus normal de transaction.","Confirmed before work starts":"Confirmé avant le début du travail",
    "AnyBike depot storage":"Stockage au dépôt AnyBike","£6.95 per motorcycle / day inc. VAT":"6,95 £ par moto / jour TTC","Multi-bike orders / consolidated shipments":"Commandes multi-motos / expéditions groupées","AnyBike may waive or reduce storage while an active multi-motorcycle order or consolidated shipment is being built.":"AnyBike peut supprimer ou réduire les frais de stockage pendant la constitution d’une commande active multi-motos ou d’une expédition groupée.","At AnyBike's discretion":"À la discrétion d’AnyBike",
    "If onward movement is delayed by the buyer, storage charges may apply from the date AnyBike notifies the buyer. Waivers are discretionary and may be reviewed where payment, shipping instructions, freight booking or collection is delayed.":"Si l’acheminement suivant est retardé par l’acheteur, des frais de stockage peuvent s’appliquer à partir de la date de notification par AnyBike. Les exonérations sont discrétionnaires et peuvent être réexaminées en cas de retard de paiement, d’instructions d’expédition, de réservation de fret ou d’enlèvement.",
    "There are no seller-side listing or transaction fees at present. The buyer pays the applicable AnyBike fees. Any future dealer membership or subscription services would be separate.":"Il n’y a actuellement aucun frais d’annonce ou de transaction côté vendeur. L’acheteur paie les frais AnyBike applicables. Toute future adhésion professionnelle ou service d’abonnement serait facturé séparément.",
    "How an international AnyBike purchase works":"Comment fonctionne un achat international AnyBike","From offer acceptance to collection.":"De l’acceptation de l’offre à l’enlèvement.","Optional services are selected early in the purchase so the costs are clear before the motorcycle moves into operations.":"Les services optionnels sont sélectionnés tôt dans le processus d’achat afin que les coûts soient clairs avant le passage de la moto aux opérations.",
    "Accept AnyBike offer":"Accepter l’offre AnyBike","Choose optional services":"Choisir les services optionnels","Pay £250 deposit + selected services":"Payer l’acompte de 250 £ + services choisis","Pay motorcycle balance in full":"Payer le solde intégral de la moto","Collection released":"Enlèvement autorisé","Collection Inspection if selected":"Inspection lors de l’enlèvement si choisie","Operations / shipping":"Opérations / transport",
    "Important:":"Important :","AnyBike must receive full payment before the motorcycle is collected from the seller.":"AnyBike doit recevoir le paiement intégral avant l’enlèvement de la moto chez le vendeur.",
    "Pricing principles":"Principes tarifaires","No surprise service charges.":"Aucun frais de service surprise.","We confirm the scope before paid work begins.":"Nous confirmons le périmètre avant le début du travail payant.","AnyBike fees and third-party charges are separated where practical.":"Les frais AnyBike et les coûts tiers sont séparés lorsque possible.","Destination taxes, duties and registration costs are destination-specific.":"Les taxes, droits et frais d’immatriculation dépendent de la destination.","If the scope changes, we confirm any additional charge before proceeding.":"Si le périmètre change, nous confirmons tout coût supplémentaire avant de poursuivre.",
    "AnyBike Connect":"AnyBike Connect","Tell us what you need.":"Dites-nous ce dont vous avez besoin.","Send the motorcycle, seller location, destination and services required. AnyBike can confirm the practical route and applicable charges.":"Indiquez la moto, l’emplacement du vendeur, la destination et les services nécessaires. AnyBike peut confirmer le parcours pratique et les frais applicables.","Explore International Markets":"Découvrir les marchés internationaux"
  };

  function lang(){return String(localStorage.getItem("anybikeLanguage")||localStorage.getItem("anybike_language")||document.documentElement.lang||"en").toLowerCase();}
  function apply(){
    if(!lang().startsWith("fr")) return;
    document.querySelectorAll("main *").forEach(el=>{
      const key=String(el.textContent||"").replace(/\s+/g," ").trim();
      if(map[key] && el.children.length===0) el.textContent=map[key];
    });

    document.querySelectorAll("main p.card-note").forEach(el=>{
      const key=String(el.textContent||"").replace(/\s+/g," ").trim();
      const full="Full payment must be received before AnyBike collects the motorcycle from the seller. The Collection Inspection is a visual collection check only and is not a mechanical inspection, diagnostic test or warranty. If the driver identifies a serious undisclosed discrepancy before loading, the issue is referred to AnyBike for review before collection proceeds.";
      if(key===full){
        el.innerHTML="<strong>Le paiement intégral doit être reçu avant qu’AnyBike n’enlève la moto chez le vendeur.</strong> L’inspection lors de l’enlèvement est uniquement un contrôle visuel et ne constitue ni une inspection mécanique, ni un diagnostic, ni une garantie. Si le chauffeur identifie une anomalie importante non déclarée avant le chargement, le problème est transmis à AnyBike pour examen avant la poursuite de l’enlèvement.";
      }
    });
  }
  window.addEventListener("anybikeLanguageChanged",()=>setTimeout(apply,0));
  document.addEventListener("DOMContentLoaded",()=>setTimeout(apply,50));
  const obs=new MutationObserver(()=>apply());
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(apply,100);
})();