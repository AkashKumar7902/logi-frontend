import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FaTrash, FaInfoCircle } from "react-icons/fa";
import api from "../../services/api";
import { toast } from "react-toastify";
import { clearMessages } from "../../slices/websocketSlice";
import Button from "../shared/Button";
import Select from "../shared/Select";
import Modal from "../shared/Modal";
import Badge from "../shared/Badge";
import { Card, CardBody, CardHeader, CardTitle } from "../shared/Card";
import Skeleton from "../shared/Skeleton";

function statusTone(status) {
  if (status === "Available") return "success";
  if (status === "Busy") return "warning";
  return "danger";
}

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

const DriversTab = () => {
  const dispatch = useDispatch();
  const websocketMessages = useSelector((state) => state.websocket.messages);

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignDriver, setAssignDriver] = useState({
    driverID: "",
    vehicleID: "",
  });

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (websocketMessages.length > 0) {
      websocketMessages.forEach((msg) => {
        if (msg.type === "driver_status_update") {
          const { driver_id, status } = msg.payload;
          updateDriverStatus(driver_id, status);
        }
      });
      dispatch(clearMessages());
    }
    // eslint-disable-next-line
  }, [websocketMessages]);

  const fetchDrivers = async () => {
    try {
      const response = await api.get("/admin/drivers");
      setDrivers(response.data || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      toast.error("Failed to fetch drivers.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get("/admin/vehicles");
      setVehicles(response.data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to fetch vehicles.");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    const { driverID, vehicleID } = assignDriver;
    if (!driverID || !vehicleID) {
      toast.error("Please select both driver and vehicle.");
      return;
    }
    setAssigning(true);
    try {
      await api.put(`/admin/drivers/${driverID}`, { vehicle_id: vehicleID });
      toast.success("Driver assigned to vehicle successfully.");
      setAssignDriver({ driverID: "", vehicleID: "" });
      fetchDrivers();
      fetchVehicles();
    } catch (error) {
      console.error("Error assigning driver:", error);
      toast.error("Failed to assign driver to vehicle.");
    } finally {
      setAssigning(false);
    }
  };

  const handleViewDetails = (driver) => {
    setSelectedDriver(driver);
    setShowDetails(true);
  };

  const calculatePerformanceScore = (driver) => {
    const {
      total_bookings_count,
      accepted_bookings_count,
      completed_bookings_count,
    } = driver;
    if (total_bookings_count === 0) return "0.00";
    const acceptanceRate = (accepted_bookings_count / total_bookings_count) * 100;
    const completionRate =
      accepted_bookings_count === 0
        ? 0
        : (completed_bookings_count / accepted_bookings_count) * 100;
    return ((acceptanceRate + completionRate) / 2).toFixed(2);
  };

  const updateDriverStatus = (driverID, newStatus) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverID ? { ...d, status: newStatus } : d)),
    );
    toast.info(`Driver ${driverID} status updated to ${newStatus}.`);
  };

  const availableDrivers = drivers.filter((d) => !d.vehicle_id);
  const availableVehicles = vehicles.filter((v) => !v.driver_id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Drivers</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Assign vehicles, monitor status, and review performance.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assign driver to vehicle</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleAssign} className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Driver"
              name="driverID"
              value={assignDriver.driverID}
              onChange={(e) =>
                setAssignDriver({ ...assignDriver, driverID: e.target.value })
              }
              required
            >
              <option value="">Select a driver</option>
              {availableDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.email}
                </option>
              ))}
            </Select>
            <Select
              label="Vehicle"
              name="vehicleID"
              value={assignDriver.vehicleID}
              onChange={(e) =>
                setAssignDriver({ ...assignDriver, vehicleID: e.target.value })
              }
              required
            >
              <option value="">Select a vehicle</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.vehicle_type})
                </option>
              ))}
            </Select>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" loading={assigning}>
                Assign
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All drivers</CardTitle>
          <span className="text-sm text-ink-500 dark:text-ink-400">
            {loading ? "—" : `${drivers.length} total`}
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : drivers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm text-ink-500 dark:text-ink-400">No drivers yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-900/50 text-ink-500 dark:text-ink-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium py-3 px-4">Name</th>
                  <th className="text-left font-medium py-3 px-4">Email</th>
                  <th className="text-left font-medium py-3 px-4">Vehicle</th>
                  <th className="text-left font-medium py-3 px-4">Status</th>
                  <th className="text-right font-medium py-3 px-4">Completed</th>
                  <th className="text-right font-medium py-3 px-4">Score</th>
                  <th className="text-right font-medium py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-900/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink-900 dark:text-ink-50">{d.name}</td>
                    <td className="py-3 px-4 text-ink-600 dark:text-ink-300">{d.email}</td>
                    <td className="py-3 px-4">
                      {d.vehicle_id ? (
                        <span className="text-ink-700 dark:text-ink-200 font-mono text-xs">{d.vehicle_id}</span>
                      ) : (
                        <Badge tone="neutral">Unassigned</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={statusTone(d.status)} dot>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-ink-700 dark:text-ink-200">
                      {d.completed_bookings_count}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-ink-700 dark:text-ink-200">
                      {calculatePerformanceScore(d)}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(d)}
                          aria-label="View details"
                        >
                          <FaInfoCircle />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to remove this driver?",
                              )
                            ) {
                              toast.info("Driver removal not implemented.");
                            }
                          }}
                          aria-label="Remove driver"
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
        open={showDetails && !!selectedDriver}
        onClose={() => setShowDetails(false)}
        title="Driver details"
        footer={
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
        }
      >
        {selectedDriver && (
          <div>
            <DetailRow label="Name">{selectedDriver.name}</DetailRow>
            <DetailRow label="Email">{selectedDriver.email}</DetailRow>
            <DetailRow label="Vehicle">
              {selectedDriver.vehicle_id ? (
                <span className="font-mono text-xs">{selectedDriver.vehicle_id}</span>
              ) : (
                <Badge tone="neutral">Unassigned</Badge>
              )}
            </DetailRow>
            <DetailRow label="Status">
              <Badge tone={statusTone(selectedDriver.status)} dot>
                {selectedDriver.status}
              </Badge>
            </DetailRow>
            <DetailRow label="Total bookings">
              {selectedDriver.total_bookings_count}
            </DetailRow>
            <DetailRow label="Accepted bookings">
              {selectedDriver.accepted_bookings_count}
            </DetailRow>
            <DetailRow label="Completed bookings">
              {selectedDriver.completed_bookings_count}
            </DetailRow>
            <DetailRow label="Performance score">
              {calculatePerformanceScore(selectedDriver)}%
            </DetailRow>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DriversTab;
