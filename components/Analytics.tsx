import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const data = [
  { name: 'Week 1', manual: 40, copilot: 10 },
  { name: 'Week 2', manual: 35, copilot: 25 },
  { name: 'Week 3', manual: 20, copilot: 45 },
  { name: 'Week 4', manual: 10, copilot: 65 },
];

const timeData = [
    { name: 'Proposal A', without: 120, with: 15 },
    { name: 'Proposal B', without: 90, with: 10 },
    { name: 'Proposal C', without: 150, with: 20 },
];

const Analytics: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Copilot Impact Analysis</h1>
        <p className="text-gray-500">Track adoption rates and productivity gains across the sales team.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Adoption Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposal Generation Method</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="manual" name="Manual Creation" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="copilot" name="Copilot Assisted" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Time Savings Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Spent per Proposal (Minutes)</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="without" name="Without Copilot" stroke="#ef4444" strokeWidth={2} />
                        <Line type="monotone" dataKey="with" name="With Copilot" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-green-50 rounded-lg text-green-800 text-sm font-medium text-center">
                Avg. 85% reduction in drafting time
            </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;