import { useEffect, useState } from "react";
import { Save, RefreshCw, Calendar, Clock, Globe } from "lucide-react";
import { FirestoreService } from "../lib/firestore";
import {
  DEFAULT_CADENCE_CONFIG,
  computeNextSlots,
  formatScheduledTime,
} from "../lib/scheduling";
import type { CadenceConfig } from "../types/post";

export function Settings() {
  const [config, setConfig] = useState<CadenceConfig>(DEFAULT_CADENCE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewSlots, setPreviewSlots] = useState<{
    scheduledAt: number;
    createAt: number;
  } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    // Update preview when config changes
    try {
      const slots = computeNextSlots(new Date().toISOString(), config);
      setPreviewSlots(slots);
    } catch (error) {
      console.error("Error computing preview slots:", error);
      setPreviewSlots(null);
    }
  }, [config]);

  const loadConfig = async () => {
    try {
      const configData = await FirestoreService.getCadenceConfig();
      if (configData) {
        setConfig(configData);
      }
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await FirestoreService.updateCadenceConfig(config);
      // You might want to show a success message here
    } catch (error) {
      console.error("Error saving config:", error);
      // You might want to show an error message here
    } finally {
      setSaving(false);
    }
  };

  const timezoneOptions = [
    "America/Toronto",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Vancouver",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure your blog automation schedule and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Publishing Schedule
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Publishing Interval */}
              <div>
                <label
                  htmlFor="intervalDays"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Publishing Interval
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Every</span>
                  <input
                    type="number"
                    id="intervalDays"
                    min="1"
                    max="30"
                    className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={config.intervalDays}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        intervalDays: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <span className="text-sm text-gray-600">days</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  How often to publish new blog posts
                </p>
              </div>

              {/* Publishing Time */}
              <div>
                <label
                  htmlFor="publishHour"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Publishing Time
                </label>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <select
                    id="publishHour"
                    className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={config.publishHour}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        publishHour: parseInt(e.target.value),
                      })
                    }
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00{" "}
                        {i < 12 ? "AM" : "PM"}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Local time when posts should be published
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label
                  htmlFor="timezone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Timezone
                </label>
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <select
                    id="timezone"
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={config.timezone}
                    onChange={(e) =>
                      setConfig({ ...config, timezone: e.target.value })
                    }
                  >
                    {timezoneOptions.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Timezone for scheduling posts
                </p>
              </div>

              {/* Draft Lead Time */}
              <div>
                <label
                  htmlFor="draftLeadHours"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Draft Lead Time
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    id="draftLeadHours"
                    min="1"
                    max="168"
                    className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={config.draftLeadHours}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        draftLeadHours: parseInt(e.target.value) || 24,
                      })
                    }
                  />
                  <span className="text-sm text-gray-600">
                    hours before publish time
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  How far in advance to create drafts for review
                </p>
              </div>

              {/* Reminder Time */}
              <div>
                <label
                  htmlFor="reminderHours"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Review Reminder
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    id="reminderHours"
                    min="1"
                    max="48"
                    className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={config.reminderHours || 4}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        reminderHours: parseInt(e.target.value) || 4,
                      })
                    }
                  />
                  <span className="text-sm text-gray-600">
                    hours before publish if not approved
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  When to send reminder notifications for unapproved posts
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          {/* Schedule Preview */}
          {previewSlots && (
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Schedule Preview
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Next Draft Creation
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatScheduledTime(
                      previewSlots.createAt,
                      config.timezone,
                      "PPP p"
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Next Publish Time
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatScheduledTime(
                      previewSlots.scheduledAt,
                      config.timezone,
                      "PPP p"
                    )}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Based on current settings, drafts will be created{" "}
                    {config.draftLeadHours} hours before the scheduled publish
                    time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* API Configuration */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                API Integration
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Required Environment Variables
                </p>
                <div className="bg-gray-50 rounded-md p-3">
                  <code className="text-xs text-gray-700">
                    VITE_FIREBASE_API_KEY
                    <br />
                    VITE_FIREBASE_AUTH_DOMAIN
                    <br />
                    VITE_FIREBASE_PROJECT_ID
                    <br />
                    VITE_FIREBASE_STORAGE_BUCKET
                    <br />
                    VITE_FIREBASE_MESSAGING_SENDER_ID
                    <br />
                    VITE_FIREBASE_APP_ID
                  </code>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Server Endpoints
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>POST /api/posts</div>
                  <div>POST /api/posts/:id/status</div>
                  <div>GET /api/publish-ready</div>
                  <div>POST /api/posts/:id/publish</div>
                  <div>GET /api/ideas/pick</div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Status */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Automation Status
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cadence Planner</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Manual Setup Required
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Publisher Runner</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Manual Setup Required
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Configure n8n workflows to enable full automation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
