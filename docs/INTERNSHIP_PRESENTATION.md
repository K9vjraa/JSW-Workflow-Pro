# JSW WorkFlow Pro - Internship Presentation Demo Guide

This document provides a comprehensive guide for demonstrating JSW WorkFlow Pro during your internship presentation. It includes the exact script to follow, the user journeys to showcase, and the realistic steel plant dataset to use to make the presentation compelling.

## 1. Presentation Structure

**Time Allocation: 15 Minutes**
- 00:00 - 02:00: Introduction & Problem Statement
- 02:00 - 04:00: Architecture Overview
- 04:00 - 12:00: Live Demo (The User Journey)
- 12:00 - 14:00: Key Technical Achievements
- 14:00 - 15:00: Q&A Session

---

## 2. Live Demo Script & User Journey

### A. The Setup (Admin View)
*Login as: `admin@jswworkflow.com`*

**Script:** "Welcome to JSW WorkFlow Pro. I'll start the demo from the perspective of a Plant Administrator. As an Admin, I have a bird's-eye view of the entire plant's operations. The dashboard provides immediate insights into task completion rates, departmental performance, and pending safety reports."

**Actions:**
1. Show the Admin Dashboard overview.
2. Navigate to "Departments" and show the hierarchy.
3. Highlight the Audit Logs showing real-time system activity.

### B. Task Delegation (Employee / Supervisor View)
*Login as: `employee@jswworkflow.com` (Mechanical Dept)*

**Script:** "Let's switch roles. I'm now a Shift Supervisor in the Mechanical Department. A critical issue has been reported at Blast Furnace 3. I need to create a task, generate an action plan using our AI integration, and assign it to a worker on the floor."

**Actions:**
1. Go to "Tasks" -> "Create Task".
2. Enter Title: "Emergency Pulley Replacement - Blast Furnace 3 Conveyor".
3. **Crucial:** Click "Generate AI Plan" to show the Gemini integration building a step-by-step checklist.
4. Assign to "Worker Setup".
5. Set Priority to "URGENT".

### C. Execution & Realtime Chat (Worker View)
*Login as: `worker@jswworkflow.com` (Mechanical Dept)*

**Script:** "Down on the plant floor, the worker receives a real-time notification on their device. They can open the assigned task, see the exact AI-generated checklist, and start execution. If they face issues, they can use the Task Chat to communicate instantly with the supervisor, even uploading photos of the broken part."

**Actions:**
1. Open the newly assigned URGENT task.
2. Mark a few checklist items as complete.
3. Open "Task Chat".
4. Type: "Found severe wear on the secondary belt, uploading photo."
5. Submit the task as "Awaiting Review".

### D. Reporting & Analytics (Employee / Supervisor View)
*Login back as: `employee@jswworkflow.com`*

**Script:** "Back in the control room, the supervisor sees the task is complete. They can now generate an end-of-shift report. Instead of typing manually, the system aggregates all completed tasks and uses AI to generate a professional summary."

**Actions:**
1. Go to "Reports".
2. Click "Generate AI Shift Report".
3. Show the generated report format and approve it.

---

## 3. Realistic Steel Plant Sample Data

To make the demo look authentic, use this data to populate the app beforehand.

### Sample Departments
1. **Blast Furnace Operations (BFO)**: Core iron melting and extraction.
2. **Hot Strip Mill (HSM)**: Rolling slabs into flat steel coils.
3. **Mechanical Maintenance (MECH)**: Heavy machinery repair and preventative maintenance.
4. **Electrical & Instrumentation (E&I)**: PLCs, sensors, and power distribution.
5. **Quality Assurance (QA)**: Metallurgical testing and defect tracking.

### Sample Users

| Role | Name | Email | Department |
| :--- | :--- | :--- | :--- |
| **Admin** | Rajesh Kumar (Plant Head) | `rajesh.k@jswworkflow.com` | All |
| **Employee** | Amit Singh (Shift In-Charge) | `amit.s@jswworkflow.com` | Mechanical |
| **Employee** | Priya Patel (QA Lead) | `priya.p@jswworkflow.com` | Quality Assurance |
| **Worker** | Vikram Verma (Technician) | `vikram.v@jswworkflow.com` | Mechanical |
| **Worker** | Suresh Rao (Operator) | `suresh.r@jswworkflow.com` | Blast Furnace |

### Sample Tasks & Checklists

**Task 1 (Maintenance)**
- **Title**: Replace worn bearing on Conveyor Belt C-14
- **Priority**: HIGH
- **Assignee**: Vikram Verma
- **AI Checklist**:
  - [ ] Isolate power to Conveyor C-14 (LOTO procedure).
  - [ ] Remove safety guards around bearing housing.
  - [ ] Extract damaged bearing using hydraulic puller.
  - [ ] Install SKF-3320 series replacement bearing.
  - [ ] Lubricate and reinstall safety guards.

**Task 2 (Operations)**
- **Title**: Slag pit clearing at Furnace #2
- **Priority**: MEDIUM
- **Assignee**: Suresh Rao
- **AI Checklist**:
  - [ ] Verify slag cooling time has exceeded 4 hours.
  - [ ] Position payload loader safely.
  - [ ] Excavate cooled slag and load into transit dumpers.

**Task 3 (Quality)**
- **Title**: Spectrometer analysis of Coil Batch #8892
- **Priority**: HIGH
- **Assignee**: Priya Patel
- **AI Checklist**:
  - [ ] Extract 50mm sample from Coil #8892.
  - [ ] Run optical emission spectrometer test.
  - [ ] Verify Carbon content is < 0.15%.

### Sample Chat Transcripts for Demo
*In Task 1 (Conveyor Bearing)*
- **Vikram (Worker)**: "Supervisor, the housing is slightly cracked. Should we replace the entire unit?"
- **Amit (Employee)**: "Hold on, let me check inventory... Yes, grab Unit H-12 from Stores. I'm updating the task description now."
- **Vikram (Worker)**: "Copy that. Proceeding with housing replacement."

### Sample AI Generated Shift Report
**Title**: End of Shift Report - Night Shift (Mechanical)
**Summary**:
"During the night shift, 14 scheduled maintenance tasks were successfully completed. Critical intervention was required on Conveyor Belt C-14 due to bearing failure and subsequent housing cracks. The team reacted efficiently, replacing the entire unit with minimal downtime. Preventative greasing was completed on all secondary crushers. No safety incidents reported.
*Prepared by JSW WorkFlow AI based on 14 completed tasks.*"
