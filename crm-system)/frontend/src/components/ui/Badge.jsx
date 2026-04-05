const colors = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  QUALIFIED: 'bg-purple-100 text-purple-700',
  PROPOSAL: 'bg-orange-100 text-orange-700',
  NEGOTIATION: 'bg-pink-100 text-pink-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
  CALL: 'bg-blue-100 text-blue-700',
  EMAIL: 'bg-indigo-100 text-indigo-700',
  MEETING: 'bg-purple-100 text-purple-700',
  NOTE: 'bg-gray-100 text-gray-700',
  TASK: 'bg-orange-100 text-orange-700',
  ADMIN: 'bg-red-100 text-red-700',
  EMPLOYEE: 'bg-blue-100 text-blue-700',
};

// Display labels in proper case
const labels = {
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
  WON: 'Won',
  LOST: 'Lost',
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  NOTE: 'Note',
  TASK: 'Task',
};

export default function Badge({ value, label }) {
  const text = label || labels[value] || value;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-700'}`}>
      {text}
    </span>
  );
}
