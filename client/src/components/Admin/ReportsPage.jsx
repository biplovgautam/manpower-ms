// "use client";

// import {
//     AlertCircle,
//     Award,
//     Briefcase,
//     TrendingUp,
//     Users,
//     Wallet
// } from 'lucide-react';

// import {
//     CategoryScale,
//     Chart as ChartJS,
//     Filler,
//     Legend,
//     LinearScale,
//     LineElement,
//     PointElement,
//     Title,
//     Tooltip
// } from 'chart.js';
// import { useMemo } from 'react';
// import { Chart } from 'react-chartjs-2';
// import { Button } from '../ui/Button';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

// // Register Chart.js components (Required for react-chartjs-2)
// ChartJS.register(
//     CategoryScale,
//     LinearScale,
//     PointElement,
//     LineElement,
//     Title,
//     Tooltip,
//     Legend,
//     Filler
// );

// export default function ReportsPage({ reportData }) {
//     // 1. Safety Check: If reportData is null or summary is missing, show loading or null
//     if (!reportData || !reportData.summary) {
//         return (
//             <div className="p-8 flex items-center justify-center min-h-screen text-slate-500">
//                 Initializing Operational Intelligence...
//             </div>
//         );
//     }

//     // 2. Destructure with Defaults: Prevents the "map of undefined" error
//     const {
//         summary = {},
//         chartData = [],
//         topPerformers = []
//     } = reportData;

//     const stats = useMemo(() => ({
//         revenuePipeline: (summary.processing || 0) * 1200,
//         deploymentVelocity: summary.totalWorkers > 0
//             ? Math.round((summary.deployed / summary.totalWorkers) * 100) : 0,
//         bottlenecks: summary.pending || 0
//     }), [summary]);

//     return (
//         <div className="p-8 bg-slate-50 min-h-screen space-y-8">
//             {/* Header */}
//             <div className="flex justify-between items-end">
//                 <div>
//                     <h1 className="text-3xl font-black text-slate-900">Operations Command</h1>
//                     <p className="text-slate-500 font-medium">Agency Performance & Revenue Forecast</p>
//                 </div>
//                 <div className="flex gap-3">
//                     <Button variant="outline" className="bg-white">Download PDF</Button>
//                     <Button className="bg-indigo-600">Generate Audit</Button>
//                 </div>
//             </div>

//             {/* CEO KPI Bar */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//                 <KPICard title="Projected Revenue" value={`$${stats.revenuePipeline.toLocaleString()}`} icon={<Wallet className="text-emerald-500" />} trend="+12% vs last month" />
//                 <KPICard title="Deployment Rate" value={`${stats.deploymentVelocity}%`} icon={<TrendingUp className="text-indigo-500" />} trend="On Track" />
//                 <KPICard title="Active Pipeline" value={(summary.processing || 0) + (summary.pending || 0)} icon={<Users className="text-blue-500" />} trend="High Volume" />
//                 <KPICard title="Critical Delays" value={stats.bottlenecks} icon={<AlertCircle className="text-rose-500" />} trend="Attention Required" color="bg-rose-50" />
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* Visualizing Growth & Demand */}
//                 <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50">
//                     <CardHeader className="flex flex-row items-center justify-between">
//                         <CardTitle className="text-lg">Recruitment vs Market Demand</CardTitle>
//                         <Briefcase className="text-slate-300" size={20} />
//                     </CardHeader>
//                     <CardContent className="h-80">
//                         {chartData.length > 0 ? (
//                             <Chart
//                                 type="line"
//                                 data={{
//                                     labels: chartData.map(d => d.date || ''),
//                                     datasets: [
//                                         {
//                                             label: 'Market Demand',
//                                             data: chartData.map(d => d.jobDemandsCreated || 0),
//                                             borderColor: '#6366f1',
//                                             fill: true,
//                                             backgroundColor: 'rgba(99, 102, 241, 0.05)',
//                                             tension: 0.4
//                                         },
//                                         {
//                                             label: 'Actual Recruitment',
//                                             data: chartData.map(d => d.workersAdded || 0),
//                                             borderColor: '#10b981',
//                                             tension: 0.4
//                                         }
//                                     ]
//                                 }}
//                                 options={{
//                                     maintainAspectRatio: false,
//                                     plugins: {
//                                         legend: { display: true, position: 'top' }
//                                     }
//                                 }}
//                             />
//                         ) : (
//                             <div className="h-full flex items-center justify-center text-slate-400 italic">
//                                 Insufficient historical data to render chart
//                             </div>
//                         )}
//                     </CardContent>
//                 </Card>

//                 {/* Top Performers */}
//                 <Card className="border-none shadow-xl shadow-slate-200/50">
//                     <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                             <Award className="text-amber-500" size={20} />
//                             Top Sub-Agents
//                         </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="space-y-6">
//                             {topPerformers.length > 0 ? topPerformers.map((agent, i) => (
//                                 <div key={i} className="flex items-center justify-between">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">#{i + 1}</div>
//                                         <p className="font-semibold text-slate-700">{agent.name}</p>
//                                     </div>
//                                     <p className="text-indigo-600 font-black">{agent.count} <span className="text-[10px] text-slate-400">Workers</span></p>
//                                 </div>
//                             )) : (
//                                 <p className="text-slate-400 text-sm">No agent activity recorded</p>
//                             )}
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Quick System Health */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 <HealthBadge label="Global Employers" value={summary.activeEmployers || 0} />
//                 <HealthBadge label="Active Sub-Agents" value={summary.activeSubAgents || 0} />
//                 <HealthBadge label="Open Job Slots" value={summary.totalDemands || 0} />
//                 <HealthBadge label="Live Markets" value="Global" />
//             </div>
//         </div>
//     );
// }

// function KPICard({ title, value, icon, trend, color = "bg-white" }) {
//     return (
//         <Card className={`${color} border-none shadow-md overflow-hidden relative group hover:scale-[1.02] transition-transform`}>
//             <CardContent className="p-6">
//                 <div className="flex justify-between items-start">
//                     <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">{icon}</div>
//                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trend}</span>
//                 </div>
//                 <div className="mt-4">
//                     <h3 className="text-3xl font-black text-slate-900">{value}</h3>
//                     <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">{title}</p>
//                 </div>
//             </CardContent>
//         </Card>
//     );
// }

// function HealthBadge({ label, value }) {
//     return (
//         <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center">
//             <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
//             <span className="text-xl font-bold text-slate-800">{value}</span>
//         </div>
//     );
// }