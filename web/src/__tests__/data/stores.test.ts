import { getMedications, saveMedications, pickColour } from '../../data/medsStore';
import { getAppointments, saveAppointments } from '../../data/apptStore';
import { medications as defaultMeds } from '../../data/mockData';
import { appointments as defaultAppts } from '../../data/appointmentsData';

describe('medsStore', () => {
  it('returns the seed medications when nothing is stored', () => {
    expect(getMedications()).toHaveLength(defaultMeds.length);
  });

  it('round-trips saved medications', () => {
    const [first] = getMedications();
    saveMedications([{ ...first, name: 'Changed name' }]);
    expect(getMedications()).toEqual([{ ...first, name: 'Changed name' }]);
  });

  it('falls back to the seed list when stored data is corrupt', () => {
    localStorage.setItem('careconnect_medications_list', '{oops');
    expect(getMedications()).toHaveLength(defaultMeds.length);
  });

  it('cycles pill colours for new medications', () => {
    expect(pickColour(0)).toBe(pickColour(6));
    expect(pickColour(0)).not.toBe(pickColour(1));
  });
});

describe('apptStore', () => {
  it('returns the seed appointments when nothing is stored', () => {
    expect(getAppointments()).toHaveLength(defaultAppts.length);
  });

  it('round-trips saved appointments', () => {
    saveAppointments([]);
    expect(getAppointments()).toEqual([]);
  });

  it('falls back to the seed list when stored data is corrupt', () => {
    localStorage.setItem('careconnect_appointments_list', 'nope');
    expect(getAppointments()).toHaveLength(defaultAppts.length);
  });
});
