-- EDUBRAIN AI — Extra curriculum seed: English Present Perfect
do $$
declare
  subj_id uuid;
  curr_id uuid;
  unit_id uuid;
  chap_id uuid;
  topic_id uuid;
  concept_id uuid;
begin
  select id into subj_id from public.subjects where slug = 'english' limit 1;
  if subj_id is null then
    insert into public.subjects (name, slug, description, icon, is_active)
    values ('English', 'english', 'Language and grammar', '📚', true)
    on conflict (slug) do update set name = excluded.name
    returning id into subj_id;
    if subj_id is null then
      select id into subj_id from public.subjects where slug = 'english' limit 1;
    end if;
  end if;
  if subj_id is null then return; end if;

  insert into public.curricula (subject_id, name, slug, description, grade_or_level, board_or_standard)
  values (subj_id, 'English Grammar Basics', 'english-grammar-basics', 'Core tenses for learners', 'General', 'General')
  on conflict (subject_id, slug) do update set name = excluded.name
  returning id into curr_id;

  insert into public.units (curriculum_id, name, slug, description, sort_order)
  values (curr_id, 'Verb Tenses', 'verb-tenses', 'Present and past forms', 1)
  on conflict (curriculum_id, slug) do update set name = excluded.name
  returning id into unit_id;

  insert into public.chapters (unit_id, name, slug, description, sort_order)
  values (unit_id, 'Present Perfect', 'present-perfect', 'Have/has + past participle', 1)
  on conflict (unit_id, slug) do update set name = excluded.name
  returning id into chap_id;

  insert into public.topics (chapter_id, name, slug, description, sort_order, estimated_minutes)
  values (chap_id, 'Form and Use', 'form-and-use', 'Structure and common uses', 1, 20)
  on conflict (chapter_id, slug) do update set name = excluded.name
  returning id into topic_id;

  insert into public.concepts (topic_id, name, slug, definition, explanation, difficulty, sort_order, concept_key)
  values (
    topic_id,
    'Present Perfect Form',
    'present-perfect-form',
    'have/has + past participle (e.g. I have finished).',
    'Use present perfect for past actions with a link to the present: experience, unfinished time, or result now. Example: She has lived here for five years.',
    'beginner',
    1,
    'english.present_perfect.form'
  )
  on conflict (topic_id, slug) do update set definition = excluded.definition
  returning id into concept_id;

  insert into public.concept_examples (concept_id, title, content, sort_order)
  values
    (concept_id, 'Experience', 'I have visited Paris. (at some time in my life)', 1),
    (concept_id, 'Result now', 'He has lost his keys. (so he cannot open the door now)', 2);

  insert into public.exercises (concept_id, topic_id, exercise_type, prompt, options, correct_answer, explanation, difficulty)
  values (
    concept_id,
    topic_id,
    'mcq',
    'Choose the correct present perfect form:',
    '["I go to school yesterday", "I have gone to school today", "I going to school", "I did went"]'::jsonb,
    '"I have gone to school today"'::jsonb,
    'Present perfect uses have/has + past participle.',
    'beginner'
  );
end $$;
