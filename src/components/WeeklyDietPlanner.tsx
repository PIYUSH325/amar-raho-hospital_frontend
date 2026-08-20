import React, { useState, useEffect } from 'react';
import { fetchDietPlan, saveDietPlan } from '../services/diet';

interface WeeklyDietPlannerProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface MealPlan {
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
}

interface DietPlanState {
  monday: MealPlan;
  tuesday: MealPlan;
  wednesday: MealPlan;
  thursday: MealPlan;
  friday: MealPlan;
  saturday: MealPlan;
  sunday: MealPlan;
}

const initialMealState = (): MealPlan => ({
  breakfast: '',
  lunch: '',
  snacks: '',
  dinner: ''
});

const initialPlanState = (): DietPlanState => ({
  monday: initialMealState(),
  tuesday: initialMealState(),
  wednesday: initialMealState(),
  thursday: initialMealState(),
  friday: initialMealState(),
  saturday: initialMealState(),
  sunday: initialMealState()
});

const daysOfWeek: Array<keyof DietPlanState> = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export const WeeklyDietPlanner: React.FC<WeeklyDietPlannerProps> = ({
  patientId,
  patientName,
  onClose,
  onSuccess
}) => {
  const [plan, setPlan] = useState<DietPlanState>(initialPlanState());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeDay, setActiveDay] = useState<keyof DietPlanState>('monday');

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const res = await fetchDietPlan(patientId);
        if (res.success && res.data) {
          const loadedData = res.data;
          const mergedPlan = initialPlanState();
          
          daysOfWeek.forEach((day) => {
            if (loadedData[day]) {
              mergedPlan[day] = {
                breakfast: loadedData[day].breakfast || '',
                lunch: loadedData[day].lunch || '',
                snacks: loadedData[day].snacks || '',
                dinner: loadedData[day].dinner || '',
              };
            }
          });
          setPlan(mergedPlan);
        }
      } catch (err: any) {
        console.error('Failed to load diet plan:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [patientId]);

  const handleMealChange = (day: keyof DietPlanState, mealType: keyof MealPlan, value: string) => {
    setPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: value
      }
    }));
  };

  // Helper: Copy active day's meal plan to all other days
  const handleCopyToAllDays = () => {
    const activeMeals = { ...plan[activeDay] };
    setPlan((prev) => {
      const updated = { ...prev };
      daysOfWeek.forEach((day) => {
        updated[day] = { ...activeMeals };
      });
      return updated;
    });
  };

  // Helper: Clear current active day's inputs
  const handleClearCurrentDay = () => {
    setPlan((prev) => ({
      ...prev,
      [activeDay]: initialMealState()
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');

    try {
      await saveDietPlan({
        patientId,
        ...plan
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save weekly diet plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '90%', width: '1200px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Modal Header */}
          <div className="modal-header bg-success text-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold d-flex align-items-center m-0">
              <i className="fa fa-utensils me-2 fs-4"></i>
              Weekly Diet & Nutrition Planner
            </h5>
            <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose} aria-label="Close"></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4 bg-light">
            {/* Patient Header Summary */}
            <div className="card border-0 shadow-sm p-3 mb-4 bg-white rounded-3 d-flex flex-row align-items-center justify-content-between">
              <div className="text-start">
                <span className="text-muted small fw-bold text-uppercase tracking-wider">Configuring Diet For</span>
                <h3 className="fw-bold text-dark m-0">{patientName}</h3>
              </div>
              <div className="text-end text-muted small d-none d-md-block">
                <i className="fa fa-info-circle me-1"></i> Changes will sync instantly to the patient's portal.
              </div>
            </div>

            {errorMsg && (
              <div className="alert alert-danger rounded-3" role="alert">
                <i className="fa fa-exclamation-triangle me-2"></i> {errorMsg}
              </div>
            )}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-2 fw-semibold">Loading patient's active diet calendar...</p>
              </div>
            ) : (
              <div>
                {/* Horizontal Calendar Navigation */}
                <div className="nav nav-pills nav-fill bg-white p-1 rounded-pill mb-4 border shadow-sm" role="tablist">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`nav-link rounded-pill py-3 text-capitalize fw-bold ${activeDay === day ? 'active bg-success text-white shadow' : 'text-muted bg-transparent border-0'}`}
                      onClick={() => setActiveDay(day)}
                      style={{ fontSize: '14px', transition: 'all 0.2s ease-in-out' }}
                    >
                      <i className="fa fa-calendar-day me-1"></i> {day}
                    </button>
                  ))}
                </div>

                {/* Active Day Meal Input Grid */}
                <div className="card border-0 shadow rounded-4 p-4 bg-white text-start">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                    <h4 className="fw-bold text-capitalize text-success m-0 d-flex align-items-center">
                      🍳 {activeDay}'s Schedule
                    </h4>
                    
                    {/* Action utilities */}
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold"
                        onClick={handleCopyToAllDays}
                        title="Apply this exact daily meal schedule to Monday-Sunday"
                      >
                        <i className="fa fa-copy me-1"></i> Copy to All Days
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold"
                        onClick={handleClearCurrentDay}
                      >
                        <i className="fa fa-trash me-1"></i> Clear Day
                      </button>
                    </div>
                  </div>

                  <div className="row g-4">
                    {/* Breakfast Card */}
                    <div className="col-md-6 col-lg-3">
                      <div className="card border-0 border-start border-4 border-warning shadow-sm h-100 p-3 bg-light-subtle">
                        <label className="fw-bold text-warning d-flex align-items-center mb-2" style={{ fontSize: '15px' }}>
                          <span className="me-2 fs-5">🌅</span> Breakfast (Morning)
                        </label>
                        <textarea
                          rows={4}
                          className="form-control border-0 shadow-none bg-white p-2 text-dark font-monospace"
                          placeholder="e.g. Oatmeal with chia seeds, banana slices, and honey."
                          value={plan[activeDay].breakfast}
                          onChange={(e) => handleMealChange(activeDay, 'breakfast', e.target.value)}
                          style={{ resize: 'none', borderLeft: '1px solid #f3f4f6' }}
                        />
                      </div>
                    </div>

                    {/* Lunch Card */}
                    <div className="col-md-6 col-lg-3">
                      <div className="card border-0 border-start border-4 border-danger shadow-sm h-100 p-3 bg-light-subtle">
                        <label className="fw-bold text-danger d-flex align-items-center mb-2" style={{ fontSize: '15px' }}>
                          <span className="me-2 fs-5">☀️</span> Lunch (Midday)
                        </label>
                        <textarea
                          rows={4}
                          className="form-control border-0 shadow-none bg-white p-2 text-dark font-monospace"
                          placeholder="e.g. Grilled chicken breast, wild brown rice, side green salad."
                          value={plan[activeDay].lunch}
                          onChange={(e) => handleMealChange(activeDay, 'lunch', e.target.value)}
                          style={{ resize: 'none', borderLeft: '1px solid #f3f4f6' }}
                        />
                      </div>
                    </div>

                    {/* Snacks Card */}
                    <div className="col-md-6 col-lg-3">
                      <div className="card border-0 border-start border-4 border-success shadow-sm h-100 p-3 bg-light-subtle">
                        <label className="fw-bold text-success d-flex align-items-center mb-2" style={{ fontSize: '15px' }}>
                          <span className="me-2 fs-5">🍎</span> Snacks (Evening)
                        </label>
                        <textarea
                          rows={4}
                          className="form-control border-0 shadow-none bg-white p-2 text-dark font-monospace"
                          placeholder="e.g. A cup of unsweetened Greek yogurt with 5-6 almonds."
                          value={plan[activeDay].snacks}
                          onChange={(e) => handleMealChange(activeDay, 'snacks', e.target.value)}
                          style={{ resize: 'none', borderLeft: '1px solid #f3f4f6' }}
                        />
                      </div>
                    </div>

                    {/* Dinner Card */}
                    <div className="col-md-6 col-lg-3">
                      <div className="card border-0 border-start border-4 border-primary shadow-sm h-100 p-3 bg-light-subtle">
                        <label className="fw-bold text-primary d-flex align-items-center mb-2" style={{ fontSize: '15px' }}>
                          <span className="me-2 fs-5">🌙</span> Dinner (Night)
                        </label>
                        <textarea
                          rows={4}
                          className="form-control border-0 shadow-none bg-white p-2 text-dark font-monospace"
                          placeholder="e.g. Steam baked salmon with olive oil, asparagus, quinoa."
                          value={plan[activeDay].dinner}
                          onChange={(e) => handleMealChange(activeDay, 'dinner', e.target.value)}
                          style={{ resize: 'none', borderLeft: '1px solid #f3f4f6' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light border-0 py-3 px-4 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary px-4 py-2 rounded-pill fw-semibold"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-success px-5 py-2 rounded-pill fw-bold"
              onClick={handleSave}
              disabled={loading || saving}
              style={{ minWidth: '160px' }}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                'Save Weekly Plan'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyDietPlanner;
