"""Conservative offline catalogue matching. Exact matches only unless a reviewed alias is supplied."""
import re
def norm(s): return re.sub(r'[^a-z0-9]+',' ',str(s).lower()).strip()
def match(record,catalogue,aliases=None):
    aliases=aliases or {}
    key=(norm(record['make']),norm(record['model']))
    same=[r for r in catalogue if norm(r['manufacturer'])==key[0]]
    alias=aliases.get(key)
    exact=[r for r in same if norm(r['model'])==key[1]]
    if alias is not None:
        targets=[r for r in same if r['id']==alias]
        if len(targets)==1: return {'status':'reviewed_alias','model_id':alias}
        return {'status':'review_required','model_id':None}
    if len(exact)==1 and key[1]!='bobber': return {'status':'exact','model_id':exact[0]['id']}
    candidates=[r['id'] for r in same if norm(r['model'])==key[1] or key[1].startswith(norm(r['model'])+' ') or norm(r['model']).endswith(' '+key[1])]
    return {'status':'review_required','model_id':None,'candidate_ids':sorted(set(candidates))}
