import { useCallback, useState } from 'react';
import { getActivePlants } from './state.js';
import { getGardenDate, localDayKey } from './time.js';
import { SpatialGarden } from './components/SpatialGarden.jsx';
import { PlantDetail } from './components/PlantDetail.jsx';
import { Herbarium } from './components/Herbarium.jsx';
import { Nursery } from './components/Nursery.jsx';
import { PlantForm } from './components/PlantForm.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';

export default function App({ garden, dispatch, storageError }) {
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [activeView, setActiveView] = useState('garden');
  const [notice, setNotice] = useState('');
  const gardenNow = getGardenDate(garden, new Date());
  const dayKey = localDayKey(gardenNow);
  const selectedPlant = garden.plants.find(({ id }) => id === selectedPlantId) ?? null;
  const activePlants = getActivePlants(garden);

  const careForToday = (plantId) => {
    const plant = activePlants.find(({ id }) => id === plantId);
    if (!plant || plant.lastCareDay === dayKey) return;
    dispatch({ type: 'CARE_FOR_PLANT', plantId, dayKey });
    setNotice(`${plant.name}: cuidado registrado.`);
  };

  const closeDetail = useCallback(() => setSelectedPlantId(null), []);
  const addPlant = (input) => {
    dispatch({ type: 'ADD_PLANT', input, now: gardenNow });
    setActiveView('garden');
    setNotice('La semilla está en incubación. Cuidarla hará aparecer el primer brote.');
  };
  const replicate = (plant) => {
    dispatch({ type: 'REPLICATE_PLANT', plantId: plant.id, now: gardenNow });
    setActiveView('garden');
    setNotice(`${plant.name}: una nueva semilla llegó al jardín.`);
  };
  const deleteHerbariumEntry = (plant) => dispatch({ type: 'DELETE_HERBARIUM_PLANT', plantId: plant.id, now: gardenNow });
  const importGarden = (imported) => {
    dispatch({ type: 'IMPORT_GARDEN', garden: imported });
    setActiveView('garden');
    setNotice('El jardín se recuperó desde el archivo JSON.');
  };
  const startNewGarden = () => {
    dispatch({ type: 'NEW_GARDEN', now: new Date() });
    setActiveView('garden');
    setNotice('');
  };
  const runDemoAction = (action) => dispatch({ ...action, now: new Date() });

  return (
    <>
      {activeView === 'garden' ? (
        <SpatialGarden
          garden={garden}
          dayKey={dayKey}
          notice={notice}
          storageError={storageError}
          onCare={careForToday}
          onSelectPlant={setSelectedPlantId}
          onNavigate={setActiveView}
          onAddPlant={addPlant}
          onDemoAction={runDemoAction}
          dispatch={dispatch}
        />
      ) : activeView === 'nursery' ? (
        <Nursery garden={garden} onBack={() => setActiveView('garden')} onCreate={addPlant} onSimulateWeek={() => dispatch({ type: 'SIMULATE_HEALTHY_WEEK' })} />
      ) : activeView === 'herbarium' ? (
        <Herbarium plants={garden.herbarium} onBack={() => setActiveView('garden')} onReplicate={replicate} onDelete={deleteHerbariumEntry} />
      ) : activeView === 'settings' ? (
        <SettingsPanel garden={garden} storageError={storageError} onBack={() => setActiveView('garden')} onImport={importGarden} onNewGarden={startNewGarden} />
      ) : (
        <PlantForm onSave={addPlant} onCancel={() => setActiveView('garden')} />
      )}
      {selectedPlant && activeView === 'garden' && (
        <PlantDetail
          key={selectedPlant.id}
          plant={selectedPlant}
          dayKey={dayKey}
          now={gardenNow}
          dispatch={dispatch}
          onClose={closeDetail}
        />
      )}
    </>
  );
}
