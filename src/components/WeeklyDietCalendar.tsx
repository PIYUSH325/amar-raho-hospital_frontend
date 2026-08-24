import React, { useState, useEffect } from 'react';
import { fetchDietPlan, fetchComplianceLogs, saveComplianceLog } from '../services/diet';

export const WeeklyDietCalendar: React.FC = () => {
  // Weekly Diet & Compliance states
  const [weeklyPlan, setWeeklyPlan] = useState<any>(null);
  const [complianceToday, setComplianceToday] = useState<any>(null);
  const [monthlyCompliance, setMonthlyCompliance] = useState<any[]>([]);
  const [loadingDiet, setLoadingDiet] = useState(false);
  const [activeWeeklyTab, setActiveWeeklyTab] = useState<'today' | 'week' | 'month'>('today');
  const [selectedDietDay, setSelectedDietDay] = useState<string>(
    new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase()
  );
  
  // Modal selection state
  const [selectedCalendarDayLog, setSelectedCalendarDayLog] = useState<{
    date: string;
    dayName: string;
    meals: any;
    compliance: any;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDietData = async () => {
    setLoadingDiet(true);
    setErrorMsg(null);
    try {
      const planRes = await fetchDietPlan(); // Self query
      if (planRes.success) {
        setWeeklyPlan(planRes.data);
      }
      
      // Calculate first and last date of the current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const logsRes = await fetchComplianceLogs('me', firstDay, lastDay);
      if (logsRes.success && logsRes.data) {
        setMonthlyCompliance(logsRes.data);
        
        // Populate complianceToday for the current date
        const todayStr = now.toISOString().split('T')[0];
        const todayLog = logsRes.data.find((log: any) => log.date === todayStr);
        setComplianceToday(todayLog || null);
      } else {
        setMonthlyCompliance([]);
        setComplianceToday(null);
      }
    } catch (err: any) {
      console.error("Failed to load diet data:", err.message);
      setErrorMsg(err.message || 'Failed to load nutrition logs.');
    } finally {
      setLoadingDiet(false);
    }
  };

  useEffect(() => {
    loadDietData();
  }, []);

  const handleDayClick = (dayNum: number) => {
    if (!weeklyPlan) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dOfWeek = new Date(now.getFullYear(), now.getMonth(), dayNum).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayPlan = weeklyPlan[dOfWeek] || {};
    const dayLog = monthlyCompliance.find((log: any) => log.date === dateStr);
    
    setSelectedCalendarDayLog({
      date: dateStr,
      dayName: dOfWeek,
      meals: dayPlan,
      compliance: dayLog
    });
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mt-5 bg-white">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold text-dark m-0">🥗 Weekly Diet Calendar & Meal Adherence</h4>
          <p className="text-muted small m-0">Track your daily meal compliance as assigned by your doctor.</p>
        </div>
        
        {/* Segment Selector tabs */}
        <div className="btn-group bg-light p-1 rounded-pill border" style={{ padding: '2px' }}>
          <button
            type="button"
            className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${activeWeeklyTab === 'today' ? 'btn-success text-white shadow-sm' : 'btn-light text-muted border-0 bg-transparent'}`}
            onClick={() => setActiveWeeklyTab('today')}
          >
            Day Timeline
          </button>
          <button
            type="button"
            className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${activeWeeklyTab === 'week' ? 'btn-success text-white shadow-sm' : 'btn-light text-muted border-0 bg-transparent'}`}
            onClick={() => setActiveWeeklyTab('week')}
          >
            7-Day Plan
          </button>
          <button
            type="button"
            className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${activeWeeklyTab === 'month' ? 'btn-success text-white shadow-sm' : 'btn-light text-muted border-0 bg-transparent'}`}
            onClick={() => setActiveWeeklyTab('month')}
          >
            Month Streak
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-danger py-2 rounded-3 text-start small mb-3">
          <i className="fa fa-exclamation-circle me-2"></i>{errorMsg}
        </div>
      )}

      {loadingDiet ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="text-muted mt-2 small">Loading your nutrition data...</p>
        </div>
      ) : !weeklyPlan ? (
        <div className="text-center py-5 text-muted border border-dashed rounded-4 bg-light">
          <i className="fa fa-utensils fa-2x mb-3 text-muted"></i>
          <p className="m-0 fw-semibold">No weekly diet calendar assigned.</p>
          <p className="small text-muted mt-1">Consult with your physician to create a structured meal plan.</p>
        </div>
      ) : activeWeeklyTab === 'today' ? (
        /* TODAY'S COMPLIANCE LOG CARD WITH HOUR-BASED VERTICAL TIMELINE */
        <div>
          {(() => {
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const todayName = dayNames[new Date().getDay()];
            
            const dayPlan = weeklyPlan[selectedDietDay] || {};
            const isRealToday = todayName === selectedDietDay;

            const mealSlots = [
              { key: 'breakfast', time: '08:30 AM', label: '🍳 Breakfast', desc: dayPlan.breakfast },
              { key: 'lunch', time: '01:30 PM', label: '☀️ Lunch', desc: dayPlan.lunch },
              { key: 'snacks', time: '05:00 PM', label: '🍎 Snacks', desc: dayPlan.snacks },
              { key: 'dinner', time: '08:30 PM', label: '🌙 Dinner', desc: dayPlan.dinner }
            ];

            const handleLogAdherence = async (mealSlot: string, status: string) => {
              const todayStr = new Date().toISOString().split('T')[0];
              try {
                await saveComplianceLog(todayStr, mealSlot, status);
                loadDietData();
              } catch (err: any) {
                setErrorMsg(err.message || 'Failed to update adherence.');
              }
            };

            return (
              <div className="text-start">
                {/* Day Selector Pills */}
                <div className="d-flex flex-wrap gap-2 mb-4 border-bottom pb-3">
                  {dayNames.map((dName) => {
                    const isSelected = selectedDietDay === dName;
                    const isActualToday = todayName === dName;
                    return (
                      <button
                        key={dName}
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 text-capitalize fw-semibold ${
                          isSelected ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary bg-white'
                        } ${isActualToday ? 'border-success border-2' : ''}`}
                        onClick={() => setSelectedDietDay(dName)}
                      >
                        {dName.substring(0, 3)} {isActualToday ? '•' : ''}
                      </button>
                    );
                  })}
                </div>

                <h6 className="fw-bold text-success mb-4 text-capitalize d-flex align-items-center">
                  <i className="fa fa-clock me-2"></i> Hour-wise Plan for {selectedDietDay} {isRealToday ? "(Today - Loggable)" : "(Preview Only)"}:
                </h6>

                {/* Vertical Timeline */}
                <div className="position-relative border-start border-2 border-light ms-3 ps-4">
                  {mealSlots.map((slot) => {
                    const activeStatus = isRealToday 
                      ? (complianceToday?.meals?.[slot.key] || 'Pending')
                      : 'Pending';

                    return (
                      <div key={slot.key} className="mb-4 position-relative">
                        {/* Timeline dot */}
                        <div 
                          className="position-absolute rounded-circle bg-white border border-3 border-success" 
                          style={{ width: '16px', height: '16px', left: '-33px', top: '5px' }}
                        ></div>
                        
                        <div className="card border-light shadow-sm rounded-3 p-3 bg-light-subtle">
                          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                            <div>
                              <span className="badge bg-secondary-subtle text-secondary fw-semibold mb-1" style={{ fontSize: '10px' }}>
                                <i className="fa fa-clock me-1"></i> {slot.time}
                              </span>
                              <h6 className="fw-bold text-dark m-0 mb-1">{slot.label}</h6>
                              <span className="text-secondary small">{slot.desc || 'No meal scheduled.'}</span>
                            </div>
                            
                            {slot.desc && (
                              <div className="d-flex align-items-center gap-2">
                                {isRealToday ? (
                                  <>
                                    <button
                                      type="button"
                                      className={`btn btn-sm px-3 rounded-pill fw-bold ${activeStatus === 'Followed' ? 'btn-success text-white shadow-sm' : 'btn-outline-success bg-white'}`}
                                      onClick={() => handleLogAdherence(slot.key, 'Followed')}
                                    >
                                      🟢 Followed
                                    </button>
                                    <button
                                      type="button"
                                      className={`btn btn-sm px-3 rounded-pill fw-bold ${activeStatus === 'Skipped' ? 'btn-danger text-white shadow-sm' : 'btn-outline-danger bg-white'}`}
                                      onClick={() => handleLogAdherence(slot.key, 'Skipped')}
                                    >
                                      🔴 Skipped
                                    </button>
                                  </>
                                ) : (
                                  <span className="badge bg-light border text-muted px-2 py-1">ReadOnly</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      ) : activeWeeklyTab === 'week' ? (
        /* 7-DAY SCHEDULE VIEW CALENDAR */
        <div className="table-responsive rounded-3 border">
          <table className="table align-middle mb-0 text-start">
            <thead className="table-light text-muted small fw-bold">
              <tr>
                <th style={{ width: '120px' }}>Day of Week</th>
                <th>Breakfast</th>
                <th>Lunch</th>
                <th>Snacks</th>
                <th>Dinner</th>
              </tr>
            </thead>
            <tbody className="small">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const dayPlan = weeklyPlan[day] || {};
                return (
                  <tr key={day}>
                    <td className="fw-bold text-capitalize text-dark">{day}</td>
                    <td className="text-secondary">{dayPlan.breakfast || '—'}</td>
                    <td className="text-secondary">{dayPlan.lunch || '—'}</td>
                    <td className="text-secondary">{dayPlan.snacks || '—'}</td>
                    <td className="text-secondary">{dayPlan.dinner || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* 📅 DETAILED MONTH MEAL BADGES CALENDAR VIEW */
        <div className="p-3 border rounded-4 bg-white shadow-sm overflow-hidden">
          {(() => {
            const now = new Date();
            const cYear = now.getFullYear();
            const cMonth = now.getMonth();
            const todayStr = now.toISOString().split('T')[0];
            
            const mDays = new Date(cYear, cMonth + 1, 0).getDate();
            const fDayIndex = new Date(cYear, cMonth, 1).getDay();
            const mName = now.toLocaleString('default', { month: 'long' });

            // Count total metrics
            let perfectDays = 0;
            let partialDays = 0;
            let skippedDays = 0;

            monthlyCompliance.forEach((log) => {
              const states = Object.values(log.meals || {});
              const followed = states.filter(s => s === 'Followed').length;
              const skipped = states.filter(s => s === 'Skipped').length;
              
              if (followed === 4) perfectDays++;
              else if (followed > 0) partialDays++;
              else if (skipped > 0) skippedDays++;
            });

            return (
              <div>
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 bg-light p-3 rounded-3">
                  <h5 className="fw-bold text-dark m-0">📅 {mName} {cYear} Dashboard</h5>
                  <div className="d-flex flex-wrap gap-2 small">
                    <span className="badge bg-success px-2 py-1">🟢 Perfect: {perfectDays} Days</span>
                    <span className="badge bg-warning text-dark px-2 py-1">🟡 Partial: {partialDays} Days</span>
                    <span className="badge bg-danger px-2 py-1">🔴 Missed: {skippedDays} Days</span>
                  </div>
                </div>

                {/* Weekdays Header */}
                <div className="row text-center fw-bold text-muted small py-2 mb-2 border-bottom">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="col text-center" style={{ width: '14.28%', flex: '0 0 14.28%' }}>{d}</div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="row g-0 border-start border-top">
                  {/* Offset cells */}
                  {Array(fDayIndex).fill(null).map((_, idx) => (
                    <div key={`empty-${idx}`} className="col border-bottom border-end bg-light" style={{ width: '14.28%', flex: '0 0 14.28%', minHeight: '120px', opacity: 0.3 }}></div>
                  ))}

                  {/* Month cells with meal details */}
                  {Array(mDays).fill(null).map((_, idx) => {
                    const dNum = idx + 1;
                    const dateStr = `${cYear}-${String(cMonth + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
                    
                    const dOfWeek = new Date(cYear, cMonth, dNum).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
                    const dayPlan = weeklyPlan[dOfWeek] || {};
                    const dayLog = monthlyCompliance.find(log => log.date === dateStr);

                    const mealsList = [
                      { key: 'breakfast', label: '🍳', name: dayPlan.breakfast },
                      { key: 'lunch', label: '☀️', name: dayPlan.lunch },
                      { key: 'snacks', label: '🍎', name: dayPlan.snacks },
                      { key: 'dinner', label: '🌙', name: dayPlan.dinner }
                    ];

                    return (
                      <div 
                        key={dNum} 
                        className="col border-bottom border-end p-2 d-flex flex-column bg-white text-start transition-all" 
                        style={{ width: '14.28%', flex: '0 0 14.28%', minHeight: '130px', cursor: 'pointer' }}
                        onClick={() => handleDayClick(dNum)}
                      >
                        <span className="fw-bold text-muted small mb-2">{dNum}</span>
                        <div className="overflow-hidden w-100">
                          {mealsList.map((m) => {
                            if (!m.name) return null;

                            const status = dayLog?.meals?.[m.key] || 'Pending';
                            
                            let badgeColor = 'bg-light text-secondary border';
                            if (status === 'Followed') badgeColor = 'bg-success text-white shadow-sm';
                            else if (status === 'Skipped') badgeColor = 'bg-danger text-white shadow-sm';
                            else if (dateStr === todayStr) badgeColor = 'bg-warning text-dark shadow-sm';

                            return (
                              <div key={m.key} className="mb-1">
                                <span className={`px-2 py-0.5 rounded d-block text-truncate fw-semibold ${badgeColor}`} style={{ fontSize: '8.5px', lineHeight: '1.2' }}>
                                  {m.label} {m.key.charAt(0).toUpperCase() + m.key.slice(1)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* End offset cells */}
                  {Array((7 - ((fDayIndex + mDays) % 7)) % 7).fill(null).map((_, idx) => (
                    <div key={`empty-end-${idx}`} className="col border-bottom border-end bg-light" style={{ width: '14.28%', flex: '0 0 14.28%', minHeight: '120px', opacity: 0.3 }}></div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Diet Detail Modal Popup */}
      {selectedCalendarDayLog && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-start">
              <div className="modal-header bg-success text-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold m-0 text-capitalize">
                  📅 Diet Routine: {new Date(selectedCalendarDayLog.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h5>
                <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setSelectedCalendarDayLog(null)}></button>
              </div>
              <div className="modal-body p-4 bg-light-subtle">
                <h6 className="fw-bold text-muted mb-3 text-uppercase small">Weekday Schedule: {selectedCalendarDayLog.dayName}</h6>
                <div className="d-flex flex-column gap-3">
                  {[
                    { key: 'breakfast', label: '🍳 Breakfast', desc: selectedCalendarDayLog.meals.breakfast },
                    { key: 'lunch', label: '☀️ Lunch', desc: selectedCalendarDayLog.meals.lunch },
                    { key: 'snacks', label: '🍎 Snacks', desc: selectedCalendarDayLog.meals.snacks },
                    { key: 'dinner', label: '🌙 Dinner', desc: selectedCalendarDayLog.meals.dinner }
                  ].map(meal => {
                    const status = selectedCalendarDayLog.compliance?.meals?.[meal.key] || 'Pending';
                    let statusBadge = <span className="badge bg-light border text-muted">🔘 Pending</span>;
                    if (status === 'Followed') statusBadge = <span className="badge bg-success">🟢 Followed</span>;
                    else if (status === 'Skipped') statusBadge = <span className="badge bg-danger">🔴 Skipped</span>;

                    return (
                      <div key={meal.key} className="p-3 bg-white border rounded-3 shadow-sm d-flex justify-content-between align-items-center">
                        <div style={{ maxWidth: '75%' }}>
                          <span className="fw-bold text-dark d-block mb-1">{meal.label}</span>
                          <span className="text-secondary small d-block" style={{ wordBreak: 'break-word' }}>{meal.desc || 'No specific meal assigned.'}</span>
                        </div>
                        <div>{statusBadge}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer border-0 bg-light p-3">
                <button type="button" className="btn btn-secondary px-4 rounded-pill" onClick={() => setSelectedCalendarDayLog(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
