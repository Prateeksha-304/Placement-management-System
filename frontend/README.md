# Placement Management System Frontend

This folder contains the React frontend for the KLE Technological University placement workflow. It follows the three primary user roles in the project scope: Student, Placement Officer, and Placement Coordinator.

## Run the frontend

From this folder, install the listed packages and start Vite:

```powershell
npm install
npm run dev
```

The seven supplied CSV files in `public/data` are the initial source of student, company, drive, eligibility, application, placement-history, and notification records. Changes made in the frontend are saved in browser `localStorage`. The app does not connect to a backend, database, email service, or real authentication provider.

## Demo accounts

| Role | Email |
| --- | --- |
| Student | Use any email present in `public/data/students.csv` |
| Placement Officer | `officer@kletech.ac.in` |
| Placement Coordinator | `coordinator@kletech.ac.in` |

Any password value works in this frontend-only demo. Choose the role first. The student quick-access card uses a student email from the CSV; placement officer and coordinator use the demo emails above.

Students see only opportunities that pass the automatic branch, CGPA, and backlog checks. They confirm their seat number and phone number in the apply form. The placement officer can then verify the submitted details, shortlist the applicant, and update the result. After a selection, the demo allows another application only when the new package exceeds the selected package, since the supplied requirements do not define the package threshold.

## Requirement coverage

| Project requirement | Frontend area |
| --- | --- |
| Student login, profile, company information, eligibility, branch/package search, registration, officer shortlisting, application submission and duplicate prevention | Student dashboard, profile, and Companies & Opportunities |
| Application status, selection result, package rule, registration/deadline alerts | My Applications & Results and Notifications |
| Company records, placement opportunities, criteria, eligibility review, registration verification, shortlisting and status updates | Placement Officer workspace |
| Publish placement notices to students | Placement Officer → Notices |
| Student-wise placement history, search, overall and batch-year statistics | Placement Coordinator → Placement Records and Placement Overview |

Interview scheduling, candidate routing, recruiter access, system administration, public recruitment, payments, and AI selection remain outside the approved S0 project scope.
