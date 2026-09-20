/*
AnyBike
File: public-page-language.js
Purpose: Site-wide public page language controller
Date: 20 September 2026

The shared public header is the single language selector for the public site.

Supports two translation modes:
1) keyed elements via data-page-i18n / data-policy-i18n
2) page-family exact-text dictionaries for legacy/static public pages

All translation stays inside AnyBike's own JavaScript assets. No customer text is
sent to an external translation service.
*/

(function(){
  if(window.AnyBikePageLanguage){
    return;
  }

  const SUPPORTED=["en","de","fr","es","ar","id","ms","zh"];
  const registrations=[];
  const originalText=new WeakMap();
  const originalAttributes=new WeakMap();
  let translationObserver=null;
  let mutationApplyTimer=null;
  let applying=false;

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

  function textNodes(root){
    if(!root){
      return [];
    }

    const walker=document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode:function(node){
          const parent=node.parentElement;
          if(!parent) return NodeFilter.FILTER_REJECT;

          const tag=parent.tagName;
          if(["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","CODE","PRE"].includes(tag)){
            return NodeFilter.FILTER_REJECT;
          }

          if(parent.closest("[data-no-page-translate='true']")){
            return NodeFilter.FILTER_REJECT;
          }

          return String(node.nodeValue || "").trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const nodes=[];
    let node;
    while((node=walker.nextNode())){
      nodes.push(node);
    }
    return nodes;
  }

  function translateTextNodes(registration,dictionary,language){
    const textMap=dictionary.text || {};
    const root=registration.root
      ? document.querySelector(registration.root)
      : document.body;

    textNodes(root).forEach(function(node){
      if(!originalText.has(node)){
        originalText.set(node,node.nodeValue);
      }

      const source=String(originalText.get(node) || "");
      const leading=(source.match(/^\s*/) || [""])[0];
      const trailing=(source.match(/\s*$/) || [""])[0];
      const key=source.trim();

      if(!key){
        return;
      }

      const translated=
        language==="en"
          ? key
          : textMap[key];

      if(typeof translated==="string"){
        node.nodeValue=leading+translated+trailing;
      }else if(language==="en"){
        node.nodeValue=source;
      }
    });
  }

  function translateAttributes(registration,dictionary,language){
    const attributes=dictionary.attributes || {};
    const root=registration.root
      ? document.querySelector(registration.root)
      : document.body;

    if(!root) return;

    ["placeholder","aria-label","title"].forEach(function(attribute){
      root.querySelectorAll("["+attribute+"]").forEach(function(element){
        let originals=originalAttributes.get(element);
        if(!originals){
          originals={};
          originalAttributes.set(element,originals);
        }

        if(!Object.prototype.hasOwnProperty.call(originals,attribute)){
          originals[attribute]=element.getAttribute(attribute);
        }

        const source=originals[attribute];
        if(!source) return;

        const map=attributes[attribute] || {};
        const translated=language==="en" ? source : map[source];

        if(typeof translated==="string"){
          element.setAttribute(attribute,translated);
        }else if(language==="en"){
          element.setAttribute(attribute,source);
        }
      });
    });
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

    translateTextNodes(registration,dictionary,language);
    translateAttributes(registration,dictionary,language);

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
    if(applying){
      return 0;
    }

    applying=true;

    const selected=normaliseLanguage(language || selectedLanguage());
    let applied=0;

    try{
      registrations.forEach(function(registration){
        if(applyRegistration(registration,selected)){
          applied+=1;
        }
      });
    }finally{
      applying=false;
    }

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

  function startMutationObserver(){
    if(translationObserver || !document.body){
      return;
    }

    translationObserver=new MutationObserver(function(mutations){
      if(applying){
        return;
      }

      const hasRelevantChange=mutations.some(function(mutation){
        return mutation.type==="childList" && mutation.addedNodes?.length;
      });

      if(!hasRelevantChange){
        return;
      }

      clearTimeout(mutationApplyTimer);
      mutationApplyTimer=setTimeout(function(){
        apply(selectedLanguage());
      },40);
    });

    translationObserver.observe(document.body,{
      childList:true,
      subtree:true
    });
  }

  function loadMarketTranslationBundle(){
    if(!/^\/markets\//i.test(location.pathname)){ return; }
    if(document.querySelector('script[data-anybike-market-translations="true"]')){ return; }
    const script=document.createElement("script");
    script.src="/public-market-translations.js?v=20260920-1";
    script.async=false;
    script.dataset.anybikeMarketTranslations="true";
    document.head.appendChild(script);
  }

  function loadExportServiceTranslationBundle(){
    const name=location.pathname.split("/").pop();
    if(!["export-crating.html","motorcycle-collection.html"].includes(name)){ return; }
    if(document.querySelector('script[data-anybike-export-service-translations="true"]')){ return; }
    const script=document.createElement("script");
    script.src="/public-export-service-translations.js?v=20260920-1";
    script.async=false;
    script.dataset.anybikeExportServiceTranslations="true";
    document.head.appendChild(script);
  }

  function loadDictionaryBundle(){
    if(document.querySelector('script[data-anybike-page-translations="true"]')){
      return;
    }

    const script=document.createElement("script");
    script.src="/public-page-translations.js?v=20260920-2";
    script.async=false;
    script.dataset.anybikePageTranslations="true";
    script.onload=function(){
      apply(selectedLanguage());
    };
    script.onerror=function(){
      console.warn("AnyBike public page translations could not be loaded.");
    };
    document.head.appendChild(script);
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
      loadDictionaryBundle();
      loadMarketTranslationBundle();
      loadExportServiceTranslationBundle();
      apply(selectedLanguage());
      startMutationObserver();
    },{once:true});
  }else{
    loadDictionaryBundle();
      loadMarketTranslationBundle();
      loadExportServiceTranslationBundle();
      apply(selectedLanguage());
    startMutationObserver();
  }
})();