# Supabase Leads Table Schema

This is the user's actual Supabase leads table schema (project: uifjwdvkudkngqxasddd).

## Columns

| column_name                  | data_type                |
| ---------------------------- | ------------------------ |
| id                           | uuid                     |
| created_at                   | timestamp with time zone |
| first_name                   | text                     |
| last_name                    | text                     |
| email                        | text                     |
| phone                        | text                     |
| zip                          | text                     |
| event_id                     | text                     |
| status                       | text                     |
| updated_at                   | timestamp with time zone |
| name                         | text                     |
| city                         | text                     |
| state                        | text                     |
| verified_social_url          | text                     |
| user_id                      | uuid                     |
| original_client_id           | text                     |
| utm_source                   | text                     |
| utm_medium                   | text                     |
| utm_campaign                 | text                     |
| utm_term                     | text                     |
| utm_content                  | text                     |
| gclid                        | text                     |
| msclkid                      | text                     |
| fbc                          | text                     |
| fbp                          | text                     |
| fbclid                       | text                     |
| facebook_ad_id               | text                     |
| facebook_page_name           | text                     |
| client_id                    | text                     |
| client_user_agent            | text                     |
| landing_page                 | text                     |
| source_page                  | text                     |
| source_tool                  | text                     |
| source_form                  | text                     |
| original_source_tool         | text                     |
| original_session_id          | text                     |
| last_non_direct_utm_source   | text                     |
| last_non_direct_utm_medium   | text                     |
| last_non_direct_gclid        | text                     |
| last_non_direct_fbclid       | text                     |
| last_non_direct_channel      | text                     |
| last_non_direct_landing_page | text                     |
| first_touch                  | text                     |
| last_touch                   | text                     |
| window_count                 | numeric                  |
| insurance_carrier            | text                     |
| urgency_level                | text                     |
| emotional_state              | text                     |
| specific_detail              | text                     |
| timeline                     | text                     |
| notes                        | text                     |
| chat_history                 | jsonb                    |
| session_data                 | jsonb                    |
| last_evidence                | text                     |
| lead_status                  | text                     |
| lead_quality                 | text                     |
| engagement_score             | numeric                  |
| lead_score_total             | numeric                  |
| lead_score_last_7d           | numeric                  |
| estimated_deal_value         | numeric                  |
| actual_deal_value            | numeric                  |
| assigned_to                  | text                     |
| disqualification_reason      | text                     |
| qualified_cv_fired           | text                     |
| lead_id                      | uuid                     |
| last_activity_at             | timestamp with time zone |
| last_contacted_at            | timestamp with time zone |
| captured_at                  | timestamp with time zone |
| qualified_at                 | timestamp with time zone |
| disqualified_at              | timestamp with time zone |
| closed_at                    | timestamp with time zone |

## Key Differences from Previous Code

- `zip_code` → `zip` (column name)
- Has separate `first_name` and `last_name` columns
- Has `event_id` for session tracking
- Has `msclkid` for Microsoft Ads
- Has `fbc`, `fbp` for Facebook cookies
- Has `source_tool`, `source_form`, `source_page` for tracking
- Has CRM scoring fields: `lead_quality`, `engagement_score`, `lead_score_total`
