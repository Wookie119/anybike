/*
AnyBike
File: public-page-language.js
Purpose: Site-wide public page language controller
Date: 20 September 2026

The shared public header is the single language selector for the public site.

Public pages can register a translation dictionary with:
  window.AnyBikePageLanguage.register({
    page:"/example.html",
    translations:{ en:{...}, de:{...}, fr:{...}, es:{...}, ar:{...} },
    selector:"[data-page-i18n]"
  });

The controller:
- reads the same saved language as public-header.js;
- applies the page dictionary on first load;
- reapplies immediately when the header language changes;
- updates document.lang and the page title when supplied;
- never sends page text or customer data to an external translation service.

IMPORTANT:
This is the common controller. Public pages still need a translation dictionary
(or a shared page-family renderer) before they can be considered fully translated.
*/

(function(){
  if(window.AnyBikePageLanguage){
    return;
  }

  const SUPPORTED=["en","de","fr","es","ar"];
  const registrations=[];

  function normaliseLanguage(value){
    return SUPPORTED.includes(String(value || "").toLowerCase())
      ? String(value).toLowerCase()
      : "en";
  }

  function selectedLanguage(){
    return normaliseLanguage(
      window.anybikeLanguage ||
      localStorage.getItem("anybikeLanguage") ||
      localStorage.getItem("anybike_language") ||
      "en"
    );
  }

  function applyRegistration(registration,language){
    const translations=registration?.translations || {};
    const dictionary=translations[language] || translations.en;

    if(!dictionary){
      return false;
    }

    const selector=registration.selector || "[data-page-i18n]";

    document.querySelectorAll(selector).forEach(function(element){
      const key=
        element.getAttribute("data-page-i18n") ||
        element.getAttribute("data-policy-i18n") ||
        element.getAttribute("data-i18n-key");

      if(!key || !Object.prototype.hasOwnProperty.call(dictionary,key)){
        return;
      }

      const value=dictionary[key];

      if(
        registration.htmlKeys &&
        registration.htmlKeys.includes(key)
      ){
        element.innerHTML=value;
      }else{
        element.textContent=value;
      }
    });

    if(dictionary.pageTitle){
      document.title=dictionary.pageTitle;
    }

    document.documentElement.lang=language;
    document.documentElement.dir="ltr";

    if(typeof registration.afterApply==="function"){
      registration.afterApply(language,dictionary);
    }

    return true;
  }

  function apply(language){
    const selected=normaliseLanguage(language || selectedLanguage());
    let applied=0;

    registrations.forEach(function(registration){
      if(applyRegistration(registration,selected)){
        applied+=1;
      }
    });

    window.dispatchEvent(new CustomEvent("anybikePageLanguageApplied",{
      detail:{
        language:selected,
        registrationsApplied:applied
      }
    }));

    return applied;
  }

  function register(registration){
    if(!registration || !registration.translations){
      return;
    }

    registrations.push(registration);
    apply(selectedLanguage());
  }

  window.AnyBikePageLanguage={
    register,
    apply,
    selectedLanguage,
    supportedLanguages:SUPPORTED.slice()
  };

  window.addEventListener("anybikeLanguageChanged",function(event){
    apply(event.detail?.language || selectedLanguage());
  });

  window.addEventListener("anybikePublicHeaderReady",function(){
    apply(selectedLanguage());
  });

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",function(){
      apply(selectedLanguage());
    },{once:true});
  }else{
    apply(selectedLanguage());
  }
})();