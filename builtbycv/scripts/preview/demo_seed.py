"""Prints SQL that DELETES all CRM data and inserts fictional sample data for the demo.
NEVER run the output against the production database."""
import uuid, json
from datetime import datetime, timedelta, timezone

NOW = datetime(2026, 11, 17, 19, 0, tzinfo=timezone.utc)  # ~noon in Phoenix
def ago(**kw): return (NOW - timedelta(**kw)).isoformat()
def q(v):
    if v is None: return "NULL"
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, (dict, list)): return "'" + json.dumps(v).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"

out = ["BEGIN;",
       "DELETE FROM activities; DELETE FROM tasks; DELETE FROM photos; DELETE FROM leads; DELETE FROM projects; DELETE FROM customers; DELETE FROM rate_limits;",
       "DELETE FROM pipeline_stages WHERE name NOT IN ('New lead','Contacted','Consultation booked','Estimate sent','Won','In progress','Complete','Lost');"]
stage = lambda n: f"(SELECT id FROM pipeline_stages WHERE name={q(n)})"
owner = "(SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)"

people = [
  # first, last, phone, email, address, city, zip, project type, stage, value, created(hours ago), lead kind, status, source dict, extra
  ("Jessica", "Moreno", "+16025550142", "jessica.moreno@example.com", "4421 E Arcadia Ln", "Phoenix", "85018", "Kitchen Remodeling", "New lead", 17000, 2, "calculator", "new",
   {"utm_source": "google", "utm_medium": "cpc", "utm_campaign": "kitchen-remodel-phoenix", "gclid": "Cj0KCQiA-demo", "landing_page": "/?utm_source=google&utm_medium=cpc&utm_campaign=kitchen-remodel-phoenix"},
   {"calc": {"projectType": "Kitchen remodel", "size": "Medium (150–250 sq ft)", "finish": "Premium", "zip": "85018", "result": "Starting at $17,000"}, "low": 17000}),
  ("Daniel", "Kim", "+14805550188", "dkim@example.com", "7810 E Camelback Rd", "Scottsdale", "85251", "Bathroom Remodeling", "New lead", 25000, 5, "estimate", "new",
   {"referrer": "https://www.instagram.com/", "landing_page": "/projects"},
   {"budget": "$15,000 – $35,000", "timeline": "Within 3 months", "heard": "Instagram", "msg": "Primary bath is original to the house (1998). Want a walk-in shower instead of the tub and a double vanity.", "photo": True}),
  ("Emily", "Carter", "+14805550127", "emily.carter@example.com", None, "Gilbert", "85297", "Outdoor Living", "New lead", None, 26, "calculator", "new",
   {"landing_page": "/services/outdoor-living"},
   {"calc": {"projectType": "Outdoor living (patio, pergola, outdoor kitchen)", "size": "Full backyard", "finish": "Premium", "zip": "85297", "result": "Tailored proposal"}}),
  ("Priya", "Shah", "+14805550163", "priya.shah@example.com", "1320 S Rural Rd", "Tempe", "85281", "ADUs & Casitas", "Contacted", 85000, 30, "estimate", "reviewed",
   {"landing_page": "/services/adus-casitas"},
   {"budget": "$75,000 – $150,000", "timeline": "3–6 months", "heard": "Referral from a friend or neighbor", "msg": "Looking at a detached casita for my parents. Lot is about 9,000 sq ft."}),
  ("Mark", "Thompson", "+16025550119", "mthompson@example.com", "6102 N Mockingbird Ln", "Paradise Valley", "85253", "Whole-Home Renovations", "Consultation booked", 180000, 72, "estimate", "reviewed",
   {"referrer": "https://www.google.com/", "landing_page": "/service-areas/paradise-valley"},
   {"budget": "$150,000 – $500,000", "timeline": "3–6 months", "heard": "Google search", "msg": "Full interior update on a 1980s custom home. Open the kitchen to the great room."}),
  ("Angela", "Ruiz", "+14805550174", "angela.ruiz@example.com", "22715 S Via de Colina", "Queen Creek", "85142", "Outdoor Living", "Estimate sent", 42500, 120, "estimate", "reviewed",
   {"utm_source": "facebook", "utm_medium": "paid", "utm_campaign": "backyard-fall", "fbclid": "IwAR-demo", "landing_page": "/services/outdoor-living?utm_source=facebook"},
   {"budget": "$35,000 – $75,000", "timeline": "Within 3 months", "heard": "Facebook", "msg": "Covered patio with pergola and an outdoor kitchen."}),
  ("Robert", "Chen", "+16025550136", "rchen@example.com", "1918 W Wickieup Ln", "Phoenix", "85085", "Home Additions", "Won", 96000, 240, "estimate", "reviewed",
   {"landing_page": "/services/home-additions"},
   {"budget": "$75,000 – $150,000", "timeline": "3–6 months", "heard": "Realtor or partner", "msg": "Adding a bedroom suite, about 500 sq ft."}),
  ("Sarah", "Whitfield", "+14805550151", "swhitfield@example.com", "2455 E Chatham St", "Mesa", "85213", "Kitchen Remodeling", "In progress", 58400, 600, "estimate", "reviewed",
   {"referrer": "https://www.google.com/", "landing_page": "/services/kitchen-remodeling"},
   {"budget": "$35,000 – $75,000", "timeline": "As soon as possible", "heard": "Google search", "msg": "Gut and rebuild. Want a quartzite waterfall island.", "projphotos": True}),
  ("Tom", "Alvarez", "+14805550109", "talvarez@example.com", "880 W Ray Rd", "Chandler", "85226", "Bathroom Remodeling", "Complete", 14800, 1400, "estimate", "reviewed",
   {"landing_page": "/"},
   {"budget": "Under $15,000", "timeline": "As soon as possible", "heard": "Referral from a friend or neighbor", "msg": "Guest bath refresh."}),
  ("Kevin", "O'Brien", "+16025550198", "kobrien@example.com", "320 E McDowell Rd", "Phoenix", "85004", "Commercial & Tenant Improvements", "Lost", 120000, 900, "estimate", "reviewed",
   {"utm_source": "google", "utm_medium": "cpc", "utm_campaign": "commercial-ti", "landing_page": "/services/commercial-construction"},
   {"budget": "$75,000 – $150,000", "timeline": "Within 3 months", "heard": "Google search", "msg": "Office build-out, 3,200 sq ft suite."}),
]

stage_order = ["New lead", "Contacted", "Consultation booked", "Estimate sent", "Won", "In progress", "Complete", "Lost"]
pos = {}
for (first, last, phone, email, addr, city, zp, ptype, st, val, hrs, kind, status, src, ex) in people:
    cid, pid, lid = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    created = ago(hours=hrs)
    out.append(f"INSERT INTO customers (id, first_name, last_name, email, phone, address, city, zip, created_at, updated_at) VALUES ({q(str(cid))},{q(first)},{q(last)},{q(email)},{q(phone)},{q(addr)},{q(city)},{q(zp)},{q(created)},{q(created)});")
    pos[st] = pos.get(st, 0) + 1
    out.append(f"INSERT INTO projects (id, customer_id, stage_id, title, project_type, value_cents, address, city, zip, budget_range, timeline, description, board_position, assigned_user_id, created_at, updated_at) VALUES ({q(str(pid))},{q(str(cid))},{stage(st)},{q(ptype + ' – ' + first + ' ' + last)},{q(ptype)},{q(val*100 if val else None)},{q(addr)},{q(city)},{q(zp)},{q(ex.get('budget'))},{q(ex.get('timeline'))},{q(ex.get('msg'))},{pos[st]},{owner},{q(created)},{q(ago(hours=max(1, hrs//3)))});")
    calc = ex.get("calc")
    out.append("INSERT INTO leads (id, kind, status, name, email, phone, address, zip, project_type, budget_range, timeline, heard_about, message, calc_inputs, calc_low, calc_high, utm_source, utm_medium, utm_campaign, gclid, fbclid, referrer, landing_page, submitted_from, customer_id, project_id, created_at) VALUES ("
               + ",".join([q(str(lid)), q(kind), q(status), q(first + ' ' + last), q(email), q(phone), q(addr), q(zp), q(calc['projectType'] if calc else ptype), q(ex.get('budget')), q(ex.get('timeline')), q(ex.get('heard')), q(ex.get('msg')), q(calc), q(ex.get('low')), q(None),
                           q(src.get('utm_source')), q(src.get('utm_medium')), q(src.get('utm_campaign')), q(src.get('gclid')), q(src.get('fbclid')), q(src.get('referrer')), q(src.get('landing_page')), q('/' if kind == 'calculator' else '/contact'), q(str(cid)), q(str(pid)), q(created)]) + ");")
    out.append(f"INSERT INTO activities (type, body, project_id, customer_id, lead_id, created_at) VALUES ('lead_created', {q('New lead from the price calculator' if kind=='calculator' else 'New estimate request from the website')}, {q(str(pid))}, {q(str(cid))}, {q(str(lid))}, {q(created)});")
    # walk the stage history
    idx = stage_order.index(st)
    path = stage_order[:idx + 1] if st != "Lost" else ["New lead", "Contacted", "Consultation booked", "Estimate sent", "Lost"]
    if st in ("Won", "In progress", "Complete"):
        path = [s for s in stage_order[:idx + 1]]
    steps = len(path) - 1
    for i in range(steps):
        t = ago(hours=hrs - (i + 1) * max(1, (hrs - 1) // (steps + 1)))
        out.append(f"INSERT INTO activities (type, body, project_id, user_id, created_at) VALUES ('stage_changed', {q('Moved from ' + path[i] + ' to ' + path[i+1])}, {q(str(pid))}, {owner}, {q(t)});")
    if ex.get("photo"):
        out.append(f"INSERT INTO photos (project_id, lead_id, url, storage_key, content_type, caption, created_at) VALUES ({q(str(pid))},{q(str(lid))},'/projects/kitchen-before-after/before.jpg','demo/before.jpg','image/jpeg','Uploaded by customer with estimate request',{q(created)});")
    if ex.get("projphotos"):
        out.append(f"INSERT INTO photos (project_id, url, storage_key, content_type, caption, uploaded_by_id, created_at) VALUES ({q(str(pid))},'/projects/kitchen-before-after/before.jpg','demo/before.jpg','image/jpeg','Demo day',{owner},{q(ago(hours=500))});")
        out.append(f"INSERT INTO photos (project_id, url, storage_key, content_type, caption, uploaded_by_id, created_at) VALUES ({q(str(pid))},'/projects/kitchen-before-after/after.jpg','demo/after.jpg','image/jpeg','Island and backsplash installed',{owner},{q(ago(hours=20))});")
        out.append(f"INSERT INTO activities (type, body, project_id, user_id, created_at) VALUES ('photo_added','2 photos added',{q(str(pid))},{owner},{q(ago(hours=20))});")
    globals().setdefault("IDS", {})[first] = (pid, cid)

IDS = globals()["IDS"]
notes = [
    ("Priya", 28, "Called Priya. Parents moving in next spring. Wants a 1-bed casita with a kitchenette. Checking Tempe ADU rules for her lot."),
    ("Mark", 48, "Consultation set for Thursday 9 AM. Bring the whole-home binder and finish samples."),
    ("Angela", 30, "Sent estimate: pergola, outdoor kitchen, pavers. She's comparing with one other bid."),
    ("Sarah", 96, "Cabinets delivered. Quartzite slab templated; install next week."),
    ("Sarah", 18, "Island installed. Client very happy with the waterfall edge."),
    ("Kevin", 400, "Went with a contractor they'd used before. Keep in touch for their second location."),
]
for who, hrs, body in notes:
    pid, cid = IDS[who]
    out.append(f"INSERT INTO activities (type, body, project_id, user_id, created_at) VALUES ('note', {q(body)}, {q(str(pid))}, {owner}, {q(ago(hours=hrs))});")

tasks = [
    ("Jessica", "Call new lead: Jessica Moreno", "2026-11-17", True, None),
    ("Daniel", "Call new lead: Daniel Kim", "2026-11-17", True, None),
    ("Emily", "Call new lead: Emily Carter", "2026-11-16", True, None),
    ("Angela", "Follow up on outdoor living estimate", "2026-11-17", False, None),
    ("Priya", "Send ADU feasibility notes", "2026-11-18", False, None),
    ("Mark", "Prepare whole-home proposal", "2026-11-20", False, None),
    ("Sarah", "Schedule backsplash tile install", "2026-11-16", False, None),
    ("Robert", "Submit addition plans for permit", "2026-11-19", False, None),
    ("Priya", "Call new lead: Priya Shah", "2026-11-17", True, ago(hours=28)),
    ("Robert", "Collect signed contract and deposit", "2026-11-12", False, ago(hours=150)),
    ("Tom", "Final walkthrough", "2026-11-05", False, ago(hours=1300)),
]
for who, title, due, auto, done in tasks:
    pid, cid = IDS[who]
    out.append(f"INSERT INTO tasks (title, due_date, project_id, customer_id, assigned_user_id, automated, completed_at) VALUES ({q(title)},{q(due)},{q(str(pid))},{q(str(cid))},{owner},{'true' if auto else 'false'},{q(done)});")
    if done:
        out.append(f"INSERT INTO activities (type, body, project_id, user_id, created_at) VALUES ('task_completed', {q('Completed: ' + title)}, {q(str(pid))}, {owner}, {q(done)});")

out.append("COMMIT;")
print("\n".join(out))
