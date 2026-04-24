import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaTrash, FaInfoCircle, FaPlus } from 'react-icons/fa';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Modal from '../shared/Modal';
import Badge from '../shared/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '../shared/Card';
import Skeleton from '../shared/Skeleton';

const emptyVehicle = {
  make: '',
  model: '',
  year: '',
  license_plate: '',
  vehicle_type: '',
};

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-ink-100 dark:border-ink-700 last:border-b-0">
      <span className="text-sm text-ink-500 dark:text-ink-400">{label}</span>
      <span className="text-sm font-medium text-ink-900 dark:text-ink-50 text-right">{children}</span>
    </div>
  );
}

function TableSkeleton({ rows = 4, cols = 7 }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} height={14} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

const VehiclesTab = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState(emptyVehicle);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/admin/vehicles');
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to fetch vehicles.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVehicle((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const year = Number(newVehicle.year);
    if (isNaN(year) || year <= 0) {
      toast.error('Please enter a valid year.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/vehicles', { ...newVehicle, year });
      toast.success('Vehicle added successfully.');
      setNewVehicle(emptyVehicle);
      setShowAddForm(false);
      fetchVehicles();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleID) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/admin/vehicles/${vehicleID}`);
      toast.success('Vehicle deleted successfully.');
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle.');
    }
  };

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetails(true);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Vehicles</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Manage the fleet and assign vehicles to drivers.
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm((v) => !v)}
          variant={showAddForm ? 'secondary' : 'primary'}
          leftIcon={!showAddForm && <FaPlus />}
        >
          {showAddForm ? 'Close' : 'Add vehicle'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle>Add new vehicle</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleAddVehicle} className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Make"
                name="make"
                value={newVehicle.make}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Model"
                name="model"
                value={newVehicle.model}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Year"
                type="number"
                name="year"
                value={newVehicle.year}
                onChange={handleInputChange}
                required
              />
              <Input
                label="License plate"
                name="license_plate"
                value={newVehicle.license_plate}
                onChange={handleInputChange}
                required
              />
              <Select
                label="Vehicle type"
                name="vehicle_type"
                value={newVehicle.vehicle_type}
                onChange={handleInputChange}
                required
                containerClassName="sm:col-span-2"
              >
                <option value="">Select type</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </Select>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Add vehicle
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All vehicles</CardTitle>
          <span className="text-sm text-ink-500 dark:text-ink-400">
            {loading ? '—' : `${vehicles.length} total`}
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm text-ink-500 dark:text-ink-400">No vehicles yet.</p>
              <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                Add your first vehicle to get started.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-900/50 text-ink-500 dark:text-ink-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium py-3 px-4">Make</th>
                  <th className="text-left font-medium py-3 px-4">Model</th>
                  <th className="text-left font-medium py-3 px-4">Year</th>
                  <th className="text-left font-medium py-3 px-4">License</th>
                  <th className="text-left font-medium py-3 px-4">Type</th>
                  <th className="text-left font-medium py-3 px-4">Driver</th>
                  <th className="text-right font-medium py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-900/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink-900 dark:text-ink-50">{v.make}</td>
                    <td className="py-3 px-4 text-ink-700 dark:text-ink-200">{v.model}</td>
                    <td className="py-3 px-4 text-ink-700 dark:text-ink-200 tabular-nums">{v.year}</td>
                    <td className="py-3 px-4 text-ink-700 dark:text-ink-200 font-mono text-xs">
                      {v.license_plate}
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone="brand">{v.vehicle_type}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {v.driver_id ? (
                        <span className="text-ink-700 dark:text-ink-200">{v.driver_id}</span>
                      ) : (
                        <Badge tone="neutral">Unassigned</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(v)}
                          aria-label="View details"
                        >
                          <FaInfoCircle />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVehicle(v.id)}
                          aria-label="Delete vehicle"
                          className="text-danger-600 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-500/15"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        open={showDetails && !!selectedVehicle}
        onClose={() => setShowDetails(false)}
        title="Vehicle details"
        footer={
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
        }
      >
        {selectedVehicle && (
          <div>
            <DetailRow label="Make">{selectedVehicle.make}</DetailRow>
            <DetailRow label="Model">{selectedVehicle.model}</DetailRow>
            <DetailRow label="Year">{selectedVehicle.year}</DetailRow>
            <DetailRow label="License plate">
              <span className="font-mono text-xs">{selectedVehicle.license_plate}</span>
            </DetailRow>
            <DetailRow label="Vehicle type">
              <Badge tone="brand">{selectedVehicle.vehicle_type}</Badge>
            </DetailRow>
            <DetailRow label="Driver">
              {selectedVehicle.driver_id ? (
                selectedVehicle.driver_id
              ) : (
                <Badge tone="neutral">Unassigned</Badge>
              )}
            </DetailRow>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VehiclesTab;
