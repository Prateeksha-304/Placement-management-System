import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, MapPin, Video, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { formatDate } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

const InterviewSchedule = () => {
  const { currentUser } = useAuth();
  const { interviews, jobs } = useData();

  const myInterviews = useMemo(() => {
    return interviews
      .filter((i) => i.studentId === currentUser?.id)
      .map(interview => {
        const job = jobs.find(j => j.id === interview.jobId);
        return { ...interview, job };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [interviews, jobs, currentUser]);

  const upcomingInterviews = myInterviews.filter(i => i.status === 'Scheduled');
  const pastInterviews = myInterviews.filter(i => i.status !== 'Scheduled');

  const renderInterviewCard = (interview) => (
    <div key={interview.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row gap-4 justify-between hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-bold text-gray-900">{interview.job?.company}</h3>
          <Badge 
            text={interview.status} 
            color={interview.status === 'Scheduled' ? 'blue' : interview.status === 'Completed' ? 'green' : 'red'} 
          />
          {interview.result && (
            <Badge 
              text={`Result: ${interview.result}`} 
              color={interview.result === 'Pass' ? 'green' : 'red'} 
            />
          )}
        </div>
        <p className="text-md text-indigo-600 font-medium mb-1">{interview.roundType} Round</p>
        <p className="text-sm text-gray-500 mb-4">{interview.job?.title}</p>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1 text-gray-400" />
            {formatDate(interview.date)} at {interview.time}
          </div>
          <div className="flex items-center">
            {interview.mode === 'Online' ? (
              <Video className="w-4 h-4 mr-1 text-gray-400" />
            ) : (
              <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            )}
            {interview.mode}: {interview.linkOrVenue}
          </div>
        </div>
      </div>
      
      {interview.status === 'Scheduled' && (
        <div className="md:border-l md:border-gray-100 md:pl-5 flex flex-col justify-center gap-2 min-w-[140px]">
          {interview.mode === 'Online' ? (
            <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm text-center">
              Join Meeting
            </button>
          ) : (
            <button className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm text-center">
              View Directions
            </button>
          )}
          <button className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-center">
            Reschedule
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Interview Schedule</h1>
        <p className="text-gray-500 mt-1">Manage your upcoming interviews and view past results.</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center border-b pb-2">
          <CalendarIcon className="w-5 h-5 mr-2 text-indigo-500" />
          Upcoming Interviews
        </h2>
        {upcomingInterviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <EmptyState icon={<CalendarIcon />} message="No upcoming interviews scheduled." />
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingInterviews.map(renderInterviewCard)}
          </div>
        )}
      </div>

      {pastInterviews.length > 0 && (
        <div className="space-y-6 pt-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center border-b pb-2">
            <CheckCircle className="w-5 h-5 mr-2 text-gray-500" />
            Past Interviews
          </h2>
          <div className="space-y-4 opacity-75">
            {pastInterviews.map(renderInterviewCard)}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSchedule;
