import React, { useMemo, useState } from 'react';
import { Filter, Users, CheckCircle, ShieldCheck } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { checkEligibility } from '../../utils/helpers';

export default function EligibilityManager() {
  const { jobs, students } = useData();
  const [jobId, setJobId] = useState('');

  const job = useMemo(() => jobs.find(item => item.id === jobId), [jobs, jobId]);

  const criteria = useMemo(() => {
    if (!job) return { minCGPA: 0, maxBacklogs: 0, min_sslc: 0, min_puc: 0, branches: [] };
    return {
      minCGPA: job.minCGPA ?? 0,
      maxBacklogs: job.maxBacklogs ?? 0,
      min_sslc: job.min_sslc ?? job.minSslc ?? 0,
      min_puc: job.min_puc ?? job.minPuc ?? 0,
      branches: job.branches || job.eligibleBranches || []
    };
  }, [job]);

  const eligibleStudents = useMemo(() => {
    if (!job) return [];
    return students.filter(student => checkEligibility(student, job));
  }, [job, students]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Placement opportunity eligibility</h1>
        <p className="mt-1 text-sm text-gray-500">
          Viewing eligibility criteria configured for the selected opportunity. Criteria are read-only and fetched directly from database records.
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className="block max-w-2xl text-sm font-medium text-gray-700">
          Placement opportunity
          <select
            value={jobId}
            onChange={event => setJobId(event.target.value)}
            className="input-field mt-1"
          >
            <option value="">Choose an opportunity</option>
            {jobs.map(item => (
              <option key={item.id} value={item.id}>
                {item.companyName || item.company} · {item.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {job ? (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <section className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                  <Filter size={17} className="text-red-500" />
                  Eligibility criteria
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  <ShieldCheck size={12} className="text-gray-500" />
                  Read-only
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Minimum CGPA
                  </span>
                  <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                    {criteria.minCGPA ? criteria.minCGPA : '0.0'}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Maximum active backlogs
                  </span>
                  <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                    {criteria.maxBacklogs ?? 0}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Minimum 10th (SSLC) %
                  </span>
                  <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                    {criteria.min_sslc > 0 ? `${criteria.min_sslc}%` : 'No minimum'}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Minimum 12th (PUC) %
                  </span>
                  <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                    {criteria.min_puc > 0 ? `${criteria.min_puc}%` : 'No minimum'}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Eligible branches
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {criteria.branches && criteria.branches.length > 0 ? (
                      criteria.branches.map(branch => (
                        <span
                          key={branch}
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800"
                        >
                          {branch}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs italic text-gray-500">All branches eligible</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="red-surface rounded-xl border border-red-900 bg-red-950 p-4">
              <CheckCircle className="mb-2 h-5 w-5 text-red-400" />
              <p className="text-2xl font-bold text-white">{eligibleStudents.length}</p>
              <p className="text-xs font-medium text-red-300">Automatically eligible students</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 p-5">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <Users size={18} className="text-red-500" />
                Eligible students
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Students meeting these criteria fetched directly from Supabase.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">CGPA</th>
                    <th className="px-4 py-3">10th %</th>
                    <th className="px-4 py-3">12th %</th>
                    <th className="px-4 py-3">Active backlogs</th>
                    <th className="px-4 py-3">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eligibleStudents.map(student => (
                    <tr key={student.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.usn}</p>
                      </td>
                      <td className="px-4 py-3">{student.branch}</td>
                      <td className="px-4 py-3">{student.cgpa}</td>
                      <td className="px-4 py-3">{student.sslcPercentage || student.sslc_percentage || '—'}%</td>
                      <td className="px-4 py-3">{student.pucPercentage || student.puc_percentage || '—'}%</td>
                      <td className="px-4 py-3">{student.backlogs}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">
                          Eligible
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!eligibleStudents.length && (
                <p className="p-10 text-center text-sm text-gray-500">
                  No students currently meet these criteria.
                </p>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-800">Select an opportunity</p>
          <p className="mt-1 text-sm text-gray-500">
            Eligibility is calculated automatically from student records and company criteria.
          </p>
        </div>
      )}
    </div>
  );
}
