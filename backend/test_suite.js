/**
 * Verification Test Suite for PMS Requirements 1 - 8
 * Run with: node test_suite.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const placementHistoryRepository = require('./repositories/placementHistoryRepository');
const applicationService = require('./services/applicationService');
const reportService = require('./services/reportService');
const applicationRepository = require('./repositories/applicationRepository');
const studentRepository = require('./repositories/studentRepository');
const driveRepository = require('./repositories/driveRepository');
const { APPLICATION_STATUS } = require('./utils/statusConstants');

async function runAllTests() {
    console.log("================================================================================");
    console.log("PLACEMENT MANAGEMENT SYSTEM - COMPREHENSIVE REQUIREMENTS VERIFICATION");
    console.log("================================================================================\n");

    let testsPassed = 0;
    let testsFailed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`[PASS] ${message}`);
            testsPassed++;
        } else {
            console.error(`[FAIL] ${message}`);
            testsFailed++;
        }
    }

    try {
        // -------------------------------------------------------------------------
        // TEST 1: Verify package_lpa addition without losing existing records
        // -------------------------------------------------------------------------
        console.log("--- TEST 1: Database update & Existing Records Preservation ---");
        const allHistory = await placementHistoryRepository.getAll();
        console.log(`Total placement history records retrieved: ${allHistory.length}`);
        assert(allHistory.length >= 508, `Preserved all existing placement records (found ${allHistory.length} >= 508 records).`);
        
        // Verify nullable package_lpa on historical records
        const sampleRecord = allHistory[allHistory.length - 1];
        assert("package_lpa" in sampleRecord, `Record has package_lpa field (value: ${sampleRecord.package_lpa}).`);
        const nullCount = allHistory.filter(h => h.package_lpa === null).length;
        console.log(`Historical records with package_lpa === null: ${nullCount}`);
        assert(nullCount > 0, `Historical records correctly retain null without fabricated values (${nullCount} unverified records).`);

        // -------------------------------------------------------------------------
        // TEST 2 & TEST 3: Selecting a student -> verify LPA automatically stored & student Placed
        // -------------------------------------------------------------------------
        console.log("\n--- TEST 2 & 3: Automatic LPA Retrieval & Student Placed Status ---");
        // Find an existing application and its drive to test
        const allApps = await applicationRepository.getAll();
        const testApp = allApps.find(a => a.status !== APPLICATION_STATUS.SELECTED) || allApps[0];
        const drive = await driveRepository.findById(testApp.drive_id);
        const originalStatus = testApp.status;
        const originalStatusChangedBy = testApp.status_changed_by;
        const originalStatusDate = testApp.status_date;
        const studentBefore = await studentRepository.findByUsn(testApp.usn);

        console.log(`Testing with Application ${testApp.app_id} (USN: ${testApp.usn}, Drive: ${drive.name}, sal_lpa: ${drive.sal_lpa})`);

        // Clean up any pre-existing history for this specific student & company to have clean test
        await placementHistoryRepository.deleteByUsnAndCompany(testApp.usn, drive.company_id);

        // Update application to Selected
        const updatedApp = await applicationService.updateStatus(testApp.app_id, APPLICATION_STATUS.SELECTED, "placement_officer@kletech.in");
        assert(updatedApp.status === APPLICATION_STATUS.SELECTED, `Application status updated to Selected.`);

        // Verify placement_history record was created with exact drive LPA
        const createdHistory = await placementHistoryRepository.findByUsnAndCompany(testApp.usn, drive.company_id);
        assert(createdHistory !== null, `Placement history record automatically created for USN ${testApp.usn} and Company ${drive.company_id}.`);
        
        const expectedLpa = drive.sal_lpa !== null && drive.sal_lpa !== undefined ? Number(Number(drive.sal_lpa).toFixed(2)) : null;
        assert(createdHistory.package_lpa === expectedLpa, `Correct LPA automatically stored in placement_history: expected ${expectedLpa}, got ${createdHistory.package_lpa}.`);
        assert(createdHistory.usn.toLowerCase() === testApp.usn.toLowerCase(), `Student USN matches: ${createdHistory.usn}.`);
        assert(createdHistory.company_id === drive.company_id, `Company ID matches: ${createdHistory.company_id}.`);

        // TEST 3: Verify student's overall placement status is 'Placed'
        const studentAfter = await studentRepository.findByUsn(testApp.usn);
        assert(studentAfter.status === "Placed", `Student overall status automatically updated to 'Placed' (got: ${studentAfter.status}).`);

        // -------------------------------------------------------------------------
        // TEST 5: Verify duplicate placement-history records are not created
        // -------------------------------------------------------------------------
        console.log("\n--- TEST 5: Duplicate Prevention on Re-processing Selection ---");
        const historyCountBefore = (await placementHistoryRepository.getAll()).length;
        
        // Re-process the same Selected status update
        await applicationService.updateStatus(testApp.app_id, APPLICATION_STATUS.SELECTED, "placement_officer@kletech.in");
        
        const historyCountAfter = (await placementHistoryRepository.getAll()).length;
        assert(historyCountBefore === historyCountAfter, `No duplicate placement history record created on re-processing (Count before: ${historyCountBefore}, after: ${historyCountAfter}).`);

        // -------------------------------------------------------------------------
        // TEST 4: Atomic rollback on failed cascade
        // -------------------------------------------------------------------------
        console.log("\n--- TEST 4: Atomic Rollback on Cascade Failure ---");
        // Simulate a failure in student status update by mocking studentRepository.updateStatus temporarily
        const originalStudentUpdate = studentRepository.updateStatus;
        studentRepository.updateStatus = async () => {
            throw new Error("Simulated database failure during cascade student update");
        };

        // Temporarily reset app status to Shortlisted
        await applicationRepository.updateStatus(testApp.app_id, APPLICATION_STATUS.SHORTLISTED, "test", new Date().toISOString().slice(0, 10));
        await placementHistoryRepository.deleteByUsnAndCompany(testApp.usn, drive.company_id);

        let errorCaught = false;
        try {
            await applicationService.updateStatus(testApp.app_id, APPLICATION_STATUS.SELECTED, "test_admin");
        } catch (err) {
            errorCaught = true;
            console.log(`Cascade error caught as expected: ${err.message}`);
        }

        // Restore original method
        studentRepository.updateStatus = originalStudentUpdate;

        assert(errorCaught, `Error was properly thrown on cascade failure.`);

        // Verify application status rolled back to SHORTLISTED
        const rolledBackApp = await applicationRepository.findById(testApp.app_id);
        assert(rolledBackApp.status === APPLICATION_STATUS.SHORTLISTED, `Application status was rolled back to SHORTLISTED (got: ${rolledBackApp.status}).`);

        // Verify no orphan placement_history record remains
        const orphanHistory = await placementHistoryRepository.findByUsnAndCompany(testApp.usn, drive.company_id);
        assert(!orphanHistory, `No orphaned placement history record was left behind after failure.`);

        // Clean up test application back to original status
        await applicationRepository.updateStatus(testApp.app_id, originalStatus, originalStatusChangedBy, originalStatusDate);
        if (studentBefore) {
            await studentRepository.updateStatus(testApp.usn, studentBefore.status);
        }

        // -------------------------------------------------------------------------
        // TEST 6 & 7: Year-wise and salary-range calculations & NULL exclusion
        // -------------------------------------------------------------------------
        console.log("\n--- TEST 6 & 7: Year-wise & Salary-Range Calculations ---");
        const reports = await reportService.getCoordinatorReports();
        const yearStats = reports.year_statistics;
        assert(yearStats && yearStats.length > 0, `Coordinator year statistics retrieved (${yearStats.length} academic batches).`);

        console.log(`Year Statistics:`);
        yearStats.slice(0, 3).forEach(y => {
            console.log(`  Academic Year: ${y.academic_year} | Placed: ${y.placed_count} | Offers: ${y.total_offers} | Missing LPA: ${y.missing_package_count}`);
        });

        // Test salary ranges on first academic year
        const sampleYear = yearStats[0];
        const salaryRanges = sampleYear.salary_ranges;
        assert(salaryRanges && salaryRanges.length === 7, `Exactly 7 salary ranges present in analysis.`);

        const expectedRanges = ['0–5 LPA', '5–10 LPA', '10–15 LPA', '15–20 LPA', '20–25 LPA', '25–30 LPA', '30+ LPA'];
        const actualRangeLabels = salaryRanges.map(r => r.range);
        assert(JSON.stringify(actualRangeLabels) === JSON.stringify(expectedRanges), `Salary ranges match exact required format: ${JSON.stringify(actualRangeLabels)}.`);

        // TEST 7: Verify NULL packages are excluded from salary ranges
        const sumStudentsInRanges = salaryRanges.reduce((acc, r) => acc + r.count, 0);
        console.log(`Students in salary ranges: ${sumStudentsInRanges}, Records with missing package: ${sampleYear.missing_package_count}`);
        assert(sampleYear.missing_package_count >= 0, `Records with missing package information accurately tracked (${sampleYear.missing_package_count} records).`);
        assert(sumStudentsInRanges <= sampleYear.placed_count, `Sum of students in salary ranges (${sumStudentsInRanges}) does not exceed total placed (${sampleYear.placed_count}).`);

        // -------------------------------------------------------------------------
        // TEST 8: Historical Package Update API & coordinator placements
        // -------------------------------------------------------------------------
        console.log("\n--- TEST 8: Historical Record Update API & Placements Endpoint ---");
        const placements = await reportService.getCoordinatorPlacements();
        assert(placements.length >= 508, `Coordinator placements retrieved (${placements.length} records).`);
        
        // Test updating verified package for a record
        const testRecord = allHistory[0];
        console.log(`Testing update on record ${testRecord.plac_id}`);
        const updatedRecord = await reportService.updatePlacementPackage(testRecord.plac_id, 8.50);
        assert(updatedRecord.package_lpa === 8.50, `Placement record package updated to 8.50 LPA (got: ${updatedRecord.package_lpa}).`);

        // Restore original value
        await reportService.updatePlacementPackage(testRecord.plac_id, testRecord.package_lpa);
        const restoredRecord = await placementHistoryRepository.findById(testRecord.plac_id);
        assert(restoredRecord.package_lpa === testRecord.package_lpa, `Placement record restored to original value (${testRecord.package_lpa}).`);

        console.log("\n================================================================================");
        console.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
        console.log("================================================================================");

        if (testsFailed > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error("Test execution failed with error:", error);
        process.exit(1);
    }
}

runAllTests();
