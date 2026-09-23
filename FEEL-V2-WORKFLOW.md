# FEEL V2 Architecture & Workflow Document

## Introduction
FEEL (For Every Animal, Every Life) is evolving from a simple animal reporting application into a comprehensive, end-to-end animal rescue ecosystem. The V2 architecture aims to connect Citizens, Volunteers, Paid Professionals, and NGOs into a cohesive platform that manages the entire lifecycle of an animal rescue—from initial reporting to treatment, rehoming, and final adoption.

## Vision
To create a scalable, unified ecosystem that empowers communities, independent rescuers, and established NGOs to collaborate efficiently. The ultimate goal is to ensure that every injured, abandoned, or missing animal receives timely assistance, medical care, and a loving home without operational bottlenecks.

## User Roles
1. **Citizen**: General users who report injured or abandoned animals, view the rescue feed, donate to causes, and apply for adoptions.
2. **Volunteer**: Unpaid community members who accept basic rescue cases, provide immediate on-site assistance, and coordinate transfers to NGOs or Paid Volunteers if necessary.
3. **Paid Volunteer**: Professional or compensated rescuers with specialized skills, equipment, or transport capabilities. They can directly accept cases and serve as emergency contacts for normal volunteers.
4. **NGO**: Registered organizations that handle complex cases, provide medical treatment, shelter animals, and manage official adoption paperwork.
5. **Admin**: Platform administrators responsible for user verification (especially for NGOs and Paid Volunteers), content moderation, platform configuration, and dispute resolution.

## Permissions Matrix

| Feature / Action | Citizen | Volunteer | Paid Volunteer | NGO | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Report Injury** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Nearby Feed** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Accept Rescue Case** | ❌ | ✅ | ✅ | ❌ (Transfer Only) | ✅ |
| **Transfer to NGO** | ❌ | ✅ | ✅ | ✅ (To other NGOs)| ✅ |
| **Accept/Reject Transfers** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **View Paid Volunteer Contacts** | ❌ | ✅ (Active Case) | ✅ | ✅ | ✅ |
| **List Animal for Rehome** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Apply for Adoption** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Process Adoption Paperwork** | ❌ | ❌ | ✅ (Limited) | ✅ | ✅ |
| **View NGO Analytics/Stats** | ❌ | ❌ | ❌ | ✅ (Own) | ✅ (All) |
| **Manage Users/Roles** | ❌ | ❌ | ❌ | ❌ | ✅ |

## Rescue Workflow
1. **Report Creation**: A Citizen or Volunteer spots an injured animal and creates a report detailing location, photos, and severity.
2. **Broadcasting**: A push notification is sent to nearby Volunteers and Paid Volunteers based on their configured working radius.
3. **Case Acceptance**: 
   - A Volunteer or Paid Volunteer accepts the case. Status changes to `accepted`.
   - *Crucial Feature*: If a normal Volunteer accepts the case, they instantly gain access to view nearby Paid Volunteers and their contact information for emergency assistance.
4. **On-Site Assessment**: The rescuer arrives and assesses the situation. Status changes to `under_rescue`.
5. **Resolution Path**:
   - *Direct Resolution*: Animal is treated on-site or does not require NGO intervention. Status changes to `resolved`.
   - *NGO Transfer*: Case requires extensive medical care or sheltering. Rescuer requests a transfer to a local NGO. Status changes to `ngo_transfer_requested`.

## Paid Volunteer Workflow
1. **Notification Settings**: Paid Volunteers set a configurable working radius (default 10 km) to receive instant notifications for new reports.
2. **Direct Acceptance**: They can accept unassigned reports directly from the feed just like regular Volunteers.
3. **Assistance Mode**: When normal Volunteers are overwhelmed or lack transport, they can contact nearby Paid Volunteers directly.
4. **Case Handoff**: Paid Volunteers can transport animals to NGOs and initiate formal transfers on behalf of the original reporter.
5. **Future (Request Assistance)**: An integrated in-app "SOS" button for Volunteers to digitally ping Paid Volunteers for backup.

## NGO Workflow
1. **Incoming Cases**: NGOs have a dedicated dashboard showing all `ngo_transfer_requested` cases directed at them.
2. **Transfer Review**:
   - **Accept**: The animal is admitted to the facility. Status becomes `under_treatment`.
   - **Reject**: The NGO cannot take the case (e.g., due to full capacity). The NGO *must* provide a "Reject Reason" comment. The status escalates to `rejected_by_ngo`, notifying the rescuer to find an alternative.
3. **Case Management**: Tracking medical progress, uploading veterinary bills, and updating the community (Animals Under Treatment).
4. **Transition to Adoption**: Once healed, the NGO changes the animal's status to `ready_for_adoption`.
5. **NGO Analytics**: A statistical dashboard tracking occupancy limits, historical rescue counts, and adoption success rates.

## Adoption Workflow
1. **Rehome Listings**: Citizens, Volunteers, or NGOs can create adoption listings for animals needing homes.
2. **Adoption Application**: Interested Citizens fill out an in-app application form.
3. **Paperwork & Vetting**:
   - For NGO listings, the NGO handles the vetting and paperwork directly.
   - For independent listings (Citizens/Volunteers), the platform allows them to request the main FEEL NGO or a verified Paid Volunteer to handle official paperwork, background checks, and home visits.
4. **Approval**: Application is approved. Status changes to `adoption_pending`.
5. **Finalization**: Handoff is complete and digital signatures collected. Status changes to `adopted`.

## Notification Flow
- **New Report**: Push to Volunteers/Paid Volunteers within the radius.
- **Case Accepted**: Push to the original Reporter.
- **Transfer Requested**: Push to target NGO Admins.
- **Transfer Decision**: Push to the Rescuer (Accepted/Rejected with reason).
- **Adoption Application**: Push to the Listing Owner or NGO.
- **Status Updates**: Pushed to the Reporter and users who "followed" the case.

## Report Status Lifecycle
A complete state machine for a rescue case:
1. `pending`: Initial state upon report creation.
2. `accepted`: A Volunteer or Paid Volunteer has claimed the case and is en route.
3. `under_rescue`: Rescuer is on location and actively securing/treating the animal.
4. `ngo_transfer_requested`: Rescuer has formally requested an NGO to take over the case.
5. `rejected_by_ngo`: NGO declined the transfer. Rescuer must select a different NGO.
6. `under_treatment`: Animal is admitted to the NGO or a veterinary clinic.
7. `ready_for_adoption`: Animal is fully recovered, cleared medically, and looking for a home.
8. `adoption_pending`: An adoption application is approved, awaiting final handoff/paperwork.
9. `resolved`: Terminal state. Case closed (Animal treated on site, passed away, or adopted).

## Database Entities (Core Architecture)
- **User**: `id`, `role`, `location`, `notification_radius`, `verified_status`, `contact_info`
- **Report (Case)**: `id`, `reporter_id`, `assignee_id`, `location`, `severity`, `status`, `media`, `created_at`
- **NGO_Profile**: `id`, `user_id`, `name`, `capacity`, `current_occupancy`, `stats_json`
- **Transfer_Request**: `id`, `report_id`, `from_user_id`, `to_ngo_id`, `status`, `reject_reason`
- **Adoption_Listing**: `id`, `report_id` (optional), `owner_id`, `status`, `description`
- **Adoption_Application**: `id`, `listing_id`, `applicant_id`, `status`, `paperwork_handled_by`

## Future Features
1. **Missing Reports & AI Matching**: AI-driven image recognition matching "missing" reports with "found/injured" reports.
2. **Digital SOS Dispatch**: "Request Assistance" feature allowing Volunteers to automatically ping all Paid Volunteers within a radius.
3. **Donation Escrow**: Holding donations for a specific case in escrow until veterinary bills are uploaded and verified by Admins.
4. **Transport Marketplace**: An Uber-style interface for Volunteers to request Paid Volunteers solely for transporting animals to NGOs.

## Navigation Structure
- **Home / Feed**: Nearby Feed, Quick Actions (Report Injury, SOS).
- **My Cases**: Active rescues, historical rescues.
- **NGO Portal (Role-based)**: Incoming Transfers, Occupancy Management, Patient Roster, Analytics.
- **Adoptions**: Rehome Feed, My Applications.
- **Profile**: Settings (Notification Radius), Badges, Verification Status, Contact Info.

## Edge Cases
1. **Multiple Rescuers Arriving**: The system must enforce that only the user who officially clicked "Accept" is the designated assignee. Others see the case locked as `accepted`.
2. **NGO Full Capacity**: If an NGO rejects a case, the Rescuer might be stranded. The system should automatically surface and suggest alternative nearby NGOs.
3. **Paid Volunteer Unavailability**: If no Paid Volunteer is nearby, the system must clarify to the normal Volunteer that Paid Volunteers are a fallback, not a guaranteed service.
4. **Adoption Dropouts**: If an adopter backs out at `adoption_pending`, the system must allow an easy reversion to `ready_for_adoption` without creating a new listing.
5. **Malicious Reports**: Admins need rapid moderation tools to ban users or flag reports as `spam` to prevent wasting volunteer time.

## Risks
1. **Data Privacy**: Exposing Paid Volunteer contact info must be strictly conditionally limited (only to Volunteers actively assigned to a nearby case) to prevent abuse and spam.
2. **Liability**: Paid Volunteers and NGOs handling medical cases require proper legal disclaimers within the app to protect the FEEL platform from liability regarding animal outcomes.
3. **Notification Fatigue**: If the default radius is too large in dense urban areas, users will disable notifications. The radius settings must be prominent during onboarding and easily adjustable.

## Recommendations
1. **Tiered Notification System**: Implement a smart notification delay. For example, ping users within 2km immediately. If no response in 10 minutes, expand the radius to 5km, then 10km.
2. **Verification Badges**: Clearly differentiate Verified NGOs and Paid Volunteers with distinct UI badges (e.g., a blue checkmark or shield) to build community trust.
3. **In-App Paperwork Templates**: Standardize the adoption paperwork within the app using digital signature APIs to streamline the independent rehome process and keep operations within the ecosystem.
