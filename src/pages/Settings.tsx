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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 lg:mt-2 text-sm lg:text-base text-gray-600">
          Configure your blog automation schedule and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
        {/* Settings Form */}
        <div className="xl:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                Publishing Schedule
              </h2>
            </div>

            <div className="p-4 lg:p-6 space-y-5 lg:space-y-6 text-left">
              {/* Publishing Interval */}
              <div>
                <label
                  htmlFor="intervalDays"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Publishing Interval
                </label>
                <div className="flex items-center gap-2 lg:gap-3">
                  <span className="text-xs lg:text-sm text-gray-600">Every</span>
                  <input
                    type="number"
                    id="intervalDays"
                    min="1"
                    max="30"
                    className="w-16 lg:w-20 px-2 lg:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                    value={config.intervalDays}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        intervalDays: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <span className="text-xs lg:text-sm text-gray-600">days</span>
                </div>
                <p className="mt-1.5 text-xs text-gray-500 text-left">
                  How often to publish new blog posts
                </p>
              </div>

              {/* Publishing Time */}
              <div>
                <label
                  htmlFor="publishHour"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Publishing Time
                </label>
                <div className="flex items-center gap-2 lg:gap-3">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <select
                    id="publishHour"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
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
                <p className="mt-1.5 text-xs text-gray-500 text-left">
                  Local time when posts should be published
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label
                  htmlFor="timezone"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Timezone
                </label>
                <div className="flex items-center gap-2 lg:gap-3">
                  <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <select
                    id="timezone"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
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
                <p className="mt-1.5 text-xs text-gray-500 text-left">
                  Timezone for scheduling posts
                </p>
              </div>

              {/* Draft Lead Time */}
              <div>
                <label
                  htmlFor="draftLeadHours"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Draft Lead Time
                </label>
                <div className="flex items-center gap-2 lg:gap-3">
                  <input
                    type="number"
                    id="draftLeadHours"
                    min="1"
                    max="168"
                    className="w-20 lg:w-24 px-2 lg:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                    value={config.draftLeadHours}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        draftLeadHours: parseInt(e.target.value) || 24,
                      })
                    }
                  />
                  <span className="text-xs lg:text-sm text-gray-600">
                    hours before publish time
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-500 text-left">
                  How far in advance to create drafts for review
                </p>
              </div>

              {/* Reminder Time */}
              <div>
                <label
                  htmlFor="reminderHours"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Review Reminder
                </label>
                <div className="flex items-center gap-2 lg:gap-3">
                  <input
                    type="number"
                    id="reminderHours"
                    min="1"
                    max="48"
                    className="w-20 lg:w-24 px-2 lg:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                    value={config.reminderHours || 4}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        reminderHours: parseInt(e.target.value) || 4,
                      })
                    }
                  />
                  <span className="text-xs lg:text-sm text-gray-600">
                    hours before publish if not approved
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-500 text-left">
                  When to send reminder notifications for unapproved posts
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-5 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50"
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
        <div className="space-y-4 lg:space-y-6">
          {/* Schedule Preview */}
          {previewSlots && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">
                  Schedule Preview
                </h3>
              </div>
              <div className="p-4 lg:p-6 space-y-4 text-left">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-900 mb-1.5">
                    Next Draft Creation
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">
                    {formatScheduledTime(
                      previewSlots.createAt,
                      config.timezone,
                      "PPP p"
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-900 mb-1.5">
                    Next Publish Time
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">
                    {formatScheduledTime(
                      previewSlots.scheduledAt,
                      config.timezone,
                      "PPP p"
                    )}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-left">
                    Based on current settings, drafts will be created{" "}
                    {config.draftLeadHours} hours before the scheduled publish
                    time.
                  </p>
                </div>
              </div>
            </div>
          )}  
        </div>``
      </div>
    </div>
  );
}
