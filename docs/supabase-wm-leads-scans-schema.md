# Supabase Table Schemas - wm_leads and scans

## scans table
| column_name    | data_type                | is_nullable |
| -------------- | ------------------------ | ----------- |
| id             | uuid                     | NO          |
| lead_id        | uuid                     | YES         |
| quote_url      | text                     | YES         |
| overall_score  | integer                  | YES         |
| audit_details  | jsonb                    | YES         |
| raw_response   | text                     | YES         |
| created_at     | timestamp with time zone | YES         |
| updated_at     | timestamp with time zone | YES         |

## wm_leads table
| column_name                  | data_type                | is_nullable |
| ---------------------------- | ------------------------ | ----------- |
| id                           | uuid                     | NO          |
| lead_id                      | uuid                     | YES         |
| created_at                   | timestamp with time zone | YES         |
| updated_at                   | timestamp with time zone | YES         |
| first_name                   | text                     | YES         |
| last_name                    | text                     | YES         |
| email                        | text                     | YES         |
| phone                        | text                     | YES         |
| city                         | text                     | YES         |
| state                        | text                     | YES         |
| zip                          | text                     | YES         |
| original_client_id           | text                     | YES         |
| original_session_id          | text                     | YES         |
| verified_social_url          | text                     | YES         |
| status                       | text                     | YES         |
| lead_quality                 | text                     | YES         |
| engagement_score             | numeric                  | YES         |
| assigned_to                  | text                     | YES         |
| notes                        | text                     | YES         |
| disqualification_reason      | text                     | YES         |
| qualified_cv_fired           | text                     | YES         |
| estimated_deal_value         | numeric                  | YES         |
| actual_deal_value            | numeric                  | YES         |
| captured_at                  | timestamp with time zone | YES         |
| qualified_at                 | timestamp with time zone | YES         |
| disqualified_at              | timestamp with time zone | YES         |
| last_contacted_at            | timestamp with time zone | YES         |
| closed_at                    | timestamp with time zone | YES         |
| original_source_tool         | text                     | YES         |
| utm_source                   | text                     | YES         |
| utm_medium                   | text                     | YES         |
| utm_campaign                 | text                     | YES         |
| utm_content                  | text                     | YES         |
| utm_term                     | text                     | YES         |
| landing_page                 | text                     | YES         |
| gclid                        | text                     | YES         |
| fbclid                       | text                     | YES         |
| facebook_ad_id               | text                     | YES         |
| facebook_page_name           | text                     | YES         |
| last_non_direct_utm_source   | text                     | YES         |
| last_non_direct_utm_medium   | text                     | YES         |
| last_non_direct_gclid        | text                     | YES         |
| last_non_direct_fbclid       | text                     | YES         |
| last_non_direct_channel      | text                     | YES         |
| last_non_direct_landing_page | text                     | YES         |
