/**
 * Assemble the publisher's safe public cross-link graph from 3 validated inputs:
 * 1. audited repository source URLs,
 * 2. explicitly approved + live-verified public identities,
 * 3. existing Supabase relationship rows.
 *
 * Read-only pure data transformation. NEVER writes into published HTML or DB.
 */
import { makePublicEditorialManifest } from './public-editorial-manifest.mjs';
import { graphFromCatalogueRows } from './catalogue-link-adapter.mjs';

export function assemblePublicEditorialGraph({
  inventory,
  identities=[],
  countryLinks=[],
  globalStories=[],
  storyManufacturers=[],
  modelRelationships=[],
  manufacturers=[],
  models=[],
  manufacturerAliases=[],
  regionalCountryRoutes=[]
}={}) {
  const manifest=makePublicEditorialManifest({inventory, identities});
  const graph=graphFromCatalogueRows({
    publicPages:manifest.pages,
    countryLinks, globalStories, storyManufacturers, modelRelationships, manufacturers, models, manufacturerAliases, regionalCountryRoutes
  });
  return {
    pages:graph.pages,
    diagnostics:[...manifest.diagnostics,...graph.diagnostics],
    counts:{
      identityCandidates:identities.length,
      verifiedPublicPages:graph.pages.length,
      generatedLinks:graph.pages.reduce((sum,page)=>sum+page.links.length,0),
      relationDiagnostics:graph.diagnostics.length,
      manifestDiagnostics:manifest.diagnostics.length
    },
    livePublicationVerified: false // Always false for this offline assembler; verification is per-identity input.
  };
}
