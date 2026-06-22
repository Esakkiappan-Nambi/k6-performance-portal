import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { GripVertical } from "lucide-react";
import API from "../services/api";
import { FilePlus, PlayCircle, ArrowLeft, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "react-toastify";
import "./CreateTest.css";
import {DndContext,closestCenter} from "@dnd-kit/core";
import {SortableContext,verticalListSortingStrategy,arrayMove,useSortable} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableStep({ id, children }) {
  const {attributes,listeners,setNodeRef,transform,transition,} = useSortable({ id });
  const style = {transform: CSS.Transform.toString(transform),transition,};
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}

function CreateTest() {

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setScenario((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    testName: "",
    users: "",
    duration: "",
    rampUp: "",
    loopCount: "",
    enableCsvConfig: false,
    enableCookieManager: false,
    enableCacheManager: false,
    cacheConfig: {
      clearEachIteration: false,
      maxSize: 75,
    },
    csvConfig: {
      file: null,
      variable_name: "",
    },
    cookieConfig: {
      clearEachIteration: false,
      policy: "strict",
    },
  });

  // ✅ Default step with full assertions structure including text assertions
  const defaultStep = () => ({
    id: Date.now(),
    name: `Request 1`,
    method: "GET",
    url: "",
    body: "",
    headers: "",
    enabled: true,
    thinkTime: "",
    extractVariable: false,
    variableName: "",
    jsonPath: "",
    params: [],
    assertions: {
      enabled: false,
      // numeric assertions
      status_code: "",
      max_response_time: "",
      max_error_rate: "",
      // ✅ NEW: text / response assertions (JMeter Response Assertion)
      text_assertions: [],
    },
  });

  const [scenario, setScenario] = useState([defaultStep()]);

  useEffect(() => {
    if (id) loadTestData();
  }, [id]);

  const loadTestData = async () => {
    try {
      const res = await API.get(`/test/${id}`);
      const test = res.data;
      setFormData({
        testName: test.test_name,
        users: test.users,
        duration: test.duration,
        rampUp: test.ramp_up,
        loopCount: test.loop_count,
        enableAssertions: !!test.assertions,
        enableCsvConfig: !!test.csv_enabled,
        enableCookieManager: !!test.cookie_enabled,
        enableCacheManager: !!test.cache_enabled,
        cacheConfig: {
          clearEachIteration: !!test.cache_clear_each_iteration,
          maxSize: test.cache_max_size || 75,
        },
        assertions: test.assertions
          ? JSON.parse(test.assertions)
          : { status_code: 200, max_response_time: 500, max_error_rate: 1 },
        csvConfig: {
          file: null,
          variable_name: test.csv_variables || "",
        },
        cookieConfig: {
          clearEachIteration: !!test.cookie_clear_each_iteration,
          policy: test.cookie_policy || "strict",
        },
      });
      // ✅ Ensure loaded steps have text_assertions field
      const loadedScenario = test.scenario ? JSON.parse(test.scenario) : [];
      const normalised = loadedScenario.map((step) => ({
        ...step,
        assertions: {
          ...step.assertions,
          text_assertions: step.assertions?.text_assertions || [],
        },
      }));
      setScenario(normalised);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load test!");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (["status_code", "max_response_time", "max_error_rate"].includes(name)) {
      setFormData({...formData, assertions: { ...formData.assertions, [name]: Number(value) }});
    } else if (name === "csv_file") {
      setFormData({...formData, csvConfig: { ...formData.csvConfig, file: files[0] }});
    } else if (name === "variable_name") {
      setFormData({...formData, csvConfig: { ...formData.csvConfig, variable_name: value }});
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addScenarioStep = () => {
    const newStep = {
      ...defaultStep(),
      id: Date.now(),
      name: `Request ${scenario.length + 1}`,
      assertions: {
        enabled: false,
        status_code: 200,
        max_response_time: 500,
        max_error_rate: 1,
        text_assertions: [],
      },
    };
    setScenario([...scenario, newStep]);
  };

  const duplicateStep = (stepId) => {
    const stepToDuplicate = scenario.find((step) => step.id === stepId);
    if (!stepToDuplicate) return;
    const duplicated = {
      ...stepToDuplicate,
      id: Date.now(),
      name: `${stepToDuplicate.name} (Copy)`,
      assertions: {
        ...stepToDuplicate.assertions,
        text_assertions: stepToDuplicate.assertions?.text_assertions
          ? stepToDuplicate.assertions.text_assertions.map((ta) => ({ ...ta, id: Date.now() + Math.random() }))
          : [],
      },
      params: stepToDuplicate.params
        ? stepToDuplicate.params.map((p) => ({ ...p, id: Date.now() + Math.random() }))
        : [],
    };
    const index = scenario.findIndex((step) => step.id === stepId);
    const updated = [...scenario];
    updated.splice(index + 1, 0, duplicated);
    setScenario(updated);
    toast.success(`Step "${stepToDuplicate.name}" duplicated`);
  };

  const removeStep = (stepId) => setScenario(scenario.filter((step) => step.id !== stepId));

  const updateStep = (id, field, value) =>
    setScenario(scenario.map((step) => (step.id === id ? { ...step, [field]: value } : step)));

  const updateStepAssertion = (id, field, value) =>
    setScenario(
      scenario.map((step) =>
        step.id === id ? { ...step, assertions: { ...step.assertions, [field]: value } } : step
      )
    );

  // ✅ NEW: Add a blank text assertion row to a step
  const addTextAssertion = (stepId) => {
    setScenario(
      scenario.map((step) =>
        step.id === stepId
          ? {
              ...step,
              assertions: {
                ...step.assertions,
                text_assertions: [
                  ...(step.assertions.text_assertions || []),
                  {
                    id: Date.now() + Math.random(),
                    field: "body",         // body | status_text | headers
                    condition: "contains", // contains | not_contains | equals | starts_with | ends_with | matches_regex
                    value: "",
                  },
                ],
              },
            }
          : step
      )
    );
  };

  // ✅ NEW: Update a text assertion field
  const updateTextAssertion = (stepId, taId, field, value) => {
    setScenario(
      scenario.map((step) =>
        step.id === stepId
          ? {
              ...step,
              assertions: {
                ...step.assertions,
                text_assertions: step.assertions.text_assertions.map((ta) =>
                  ta.id === taId ? { ...ta, [field]: value } : ta
                ),
              },
            }
          : step
      )
    );
  };

  // ✅ NEW: Remove a text assertion row
  const removeTextAssertion = (stepId, taId) => {
    setScenario(
      scenario.map((step) =>
        step.id === stepId
          ? {
              ...step,
              assertions: {
                ...step.assertions,
                text_assertions: step.assertions.text_assertions.filter((ta) => ta.id !== taId),
              },
            }
          : step
      )
    );
  };

  const addParam = (stepId) => {
    setScenario(
      scenario.map((step) =>
        step.id === stepId
          ? { ...step, params: [...(step.params || []), { id: Date.now() + Math.random(), name: "", value: "", enabled: true }] }
          : step
      )
    );
  };

  const updateParam = (stepId, paramId, field, value) => {
    setScenario(
      scenario.map((step) =>
        step.id === stepId
          ? { ...step, params: step.params.map((p) => (p.id === paramId ? { ...p, [field]: value } : p)) }
          : step
      )
    );
  };

  const removeParam = (stepId, paramId) => {
    setScenario(
      scenario.map((step) =>
        step.id === stepId
          ? { ...step, params: step.params.filter((p) => p.id !== paramId) }
          : step
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.testName.trim()) { toast.error("Please Enter a test name!"); return; }

    const enabledSteps = scenario.filter((step) => step.enabled);

    for (let step of enabledSteps) {
      if (!step.url.trim()) { toast.error(`URL missing in step: ${step.name}`); return; }
      if (step.extractVariable) {
        if (!step.variableName.trim()) { toast.error(`Enter variable name in step: ${step.name}`); return; }
        if (!step.jsonPath.trim()) { toast.error(`Enter JSON path in step: ${step.name}`); return; }
      }
      // ✅ Validate text assertions — value must not be empty
      const textAssertions = step.assertions?.text_assertions || [];
      for (let ta of textAssertions) {
        if (!ta.value.trim()) {
          toast.error(`Text assertion value is empty in step: ${step.name}`);
          return;
        }
      }
    }

    const payload = new FormData();
    payload.append("test_name", formData.testName);
    payload.append("users", Number(formData.users));
    payload.append("duration", Number(formData.duration));
    payload.append("ramp_up", Number(formData.rampUp));
    payload.append("loop_count", Number(formData.loopCount));
    payload.append("scenario", JSON.stringify(enabledSteps));
    payload.append("enable_cookie_manager", formData.enableCookieManager);
    payload.append("enable_cache_manager", formData.enableCacheManager);

    if (formData.enableCacheManager) {
      payload.append("cache_config", JSON.stringify(formData.cacheConfig));
    }
    if (formData.enableAssertions) {
      payload.append("assertions", JSON.stringify(formData.assertions));
    }
    if (formData.enableCsvConfig) {
      payload.append("enable_csv", formData.enableCsvConfig);
      payload.append("variable_name", formData.csvConfig.variable_name);
      if (formData.csvConfig.file) payload.append("csv_file", formData.csvConfig.file);
    }
    if (formData.enableCookieManager) {
      payload.append("cookie_config", JSON.stringify(formData.cookieConfig));
    }

    try {
      if (id) {
        await API.put(`/update-test/${id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Test updated successfully!");
      } else {
        await API.post("/create-test", payload, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Test created successfully");
      }
      navigate("/run-test");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Error saving test");
    }
  };

  return (
    <div className="create-test-page">
      <div className="create-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} /> Back
        </button>
        <h2>
          <FilePlus size={18} />
          {id ? "Edit Test" : "Create Scenario Test"}
        </h2>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        <p className="section-label">Test configuration</p>
        <div className="form-grid">
          <div className="form-group">
            <label>Test name</label>
            <input type="text" name="testName" value={formData.testName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Virtual users</label>
            <input type="number" name="users" value={formData.users} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Ramp-up (sec)</label>
            <input type="number" name="rampUp" value={formData.rampUp} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Duration (sec)</label>
            <input type="number" name="duration" value={formData.duration} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Loop count</label>
            <input type="number" name="loopCount" value={formData.loopCount} onChange={handleChange} />
          </div>
        </div>

        {formData.enableAssertions && (
          <div className="form-grid">
            <div className="form-group">
              <label>Status Code</label>
              <input type="number" name="status_code" value={formData.assertions.status_code} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Max Response Time (ms)</label>
              <input type="number" name="max_response_time" value={formData.assertions.max_response_time} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Max Error Rate (%)</label>
              <input type="number" name="max_error_rate" value={formData.assertions.max_error_rate} onChange={handleChange} />
            </div>
          </div>
        )}

        <hr className="section-divider" />

        {/* CSV */}
        <p className="section-label">
          <input type="checkbox" name="enableCsvConfig" checked={formData.enableCsvConfig} onChange={handleChange} />
          Enable CSV Data Config
        </p>
        {formData.enableCsvConfig && (
          <div className="form-grid">
            <div className="form-group">
              <label>CSV File Upload</label>
              <input type="file" name="csv_file" accept=".csv" onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Variable Name</label>
              <input type="text" name="variable_name" value={formData.csvConfig.variable_name} onChange={handleChange} placeholder="username,password" />
            </div>
          </div>
        )}

        <hr className="section-divider" />

        {/* COOKIE MANAGER */}
        <p className="section-label">
          <input type="checkbox" name="enableCookieManager" checked={formData.enableCookieManager} onChange={handleChange} />
          Enable HTTP Cookie Manager
        </p>
        {formData.enableCookieManager && (
          <div className="cookie-manager-box">
            <label className="cookie-inline-checkbox">
              <input
                type="checkbox"
                checked={formData.cookieConfig.clearEachIteration}
                onChange={(e) =>
                  setFormData({ ...formData, cookieConfig: { ...formData.cookieConfig, clearEachIteration: e.target.checked } })
                }
              />
              Clear cookies each iteration
            </label>
          </div>
        )}

        <hr className="section-divider" />

        {/* CACHE MANAGER */}
        <p className="section-label">
          <input type="checkbox" name="enableCacheManager" checked={formData.enableCacheManager} onChange={handleChange} />
          Enable HTTP Cache Manager
        </p>
        {formData.enableCacheManager && (
          <div className="cache-manager-box">
            <label className="cache-inline-checkbox">
              <input
                type="checkbox"
                checked={formData.cacheConfig.clearEachIteration}
                onChange={(e) =>
                  setFormData({ ...formData, cacheConfig: { ...formData.cacheConfig, clearEachIteration: e.target.checked } })
                }
              />
              Clear cache each iteration
            </label>
            <div className="cache-size-row">
              <label>Max cache entries</label>
              <input
                type="number"
                min="1"
                max="5000"
                value={formData.cacheConfig.maxSize}
                onChange={(e) =>
                  setFormData({ ...formData, cacheConfig: { ...formData.cacheConfig, maxSize: Number(e.target.value) } })
                }
              />
              <span className="cache-size-hint">per VU (JMeter default: 5000)</span>
            </div>
          </div>
        )}

        <hr className="section-divider" />

        {/* SCENARIO BUILDER */}
        <div className="scenario-section">
          <div className="scenario-header">
            <h3>Scenario builder</h3>
            <button type="button" className="add-step-btn" onClick={addScenarioStep}>
              <Plus size={14} /> Add step
            </button>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={scenario.map((step) => step.id)} strategy={verticalListSortingStrategy}>
              {scenario.map((step, index) => (
                <SortableStep key={step.id} id={step.id}>
                  {({ attributes, listeners }) => (
                    <div className="scenario-card">

                      {/* STEP HEADER */}
                      <div className="step-header">
                        <div className="step-left">
                          <div className="drag-handle" {...attributes} {...listeners}>
                            <GripVertical size={18} />
                          </div>
                          <span className="step-title">Step {index + 1}</span>
                        </div>
                        <div className="step-actions">
                          <button type="button" className="duplicate-btn" onClick={() => duplicateStep(step.id)} title="Duplicate step">
                            <Copy size={14} /> Duplicate
                          </button>
                          <button type="button" className="delete-btn" onClick={() => removeStep(step.id)} title="Delete step">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* MAIN STEP GRID */}
                      <div className="step-grid">
                        <label className="enable-box">
                          <input type="checkbox" checked={step.enabled} onChange={(e) => updateStep(step.id, "enabled", e.target.checked)} />
                          Enable
                        </label>
                        <input className="request-name" type="text" value={step.name} onChange={(e) => updateStep(step.id, "name", e.target.value)} placeholder="Request Name" />
                        <select className="method-box" value={step.method} onChange={(e) => updateStep(step.id, "method", e.target.value)}>
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                        <input className="think-box" type="number" placeholder="Think Time(ms)" value={step.thinkTime} onChange={(e) => updateStep(step.id, "thinkTime", e.target.value)} />
                        <input className="full-width" type="text" placeholder="Request URL" value={step.url} onChange={(e) => updateStep(step.id, "url", e.target.value)} />
                        <textarea className="header-box full-width" placeholder="Headers (JSON)" value={step.headers} onChange={(e) => updateStep(step.id, "headers", e.target.value)} />
                        <textarea className="body-box full-width" placeholder="Request Body (JSON)" value={step.body} onChange={(e) => updateStep(step.id, "body", e.target.value)} />
                      </div>

                      {/* GET PARAMETERS */}
                      {step.method === "GET" && (
                        <div className="params-box">
                          <div className="params-header">
                            <span className="params-label">Parameters</span>
                            <button type="button" className="add-param-btn" onClick={() => addParam(step.id)}>
                              <Plus size={12} /> Add Parameter
                            </button>
                          </div>
                          {step.params && step.params.length > 0 && (
                            <div className="params-table">
                              <div className="params-row params-row-header">
                                <span className="params-col-enable"></span>
                                <span className="params-col-name">Name</span>
                                <span className="params-col-value">Value</span>
                                <span className="params-col-action"></span>
                              </div>
                              {step.params.map((param) => (
                                <div className="params-row" key={param.id}>
                                  <span className="params-col-enable">
                                    <input type="checkbox" checked={param.enabled} onChange={(e) => updateParam(step.id, param.id, "enabled", e.target.checked)} />
                                  </span>
                                  <span className="params-col-name">
                                    <input type="text" placeholder="Parameter name" value={param.name} onChange={(e) => updateParam(step.id, param.id, "name", e.target.value)} />
                                  </span>
                                  <span className="params-col-value">
                                    <input type="text" placeholder="Value" value={param.value} onChange={(e) => updateParam(step.id, param.id, "value", e.target.value)} />
                                  </span>
                                  <span className="params-col-action">
                                    <button type="button" className="remove-param-btn" onClick={() => removeParam(step.id, param.id)}>
                                      <Trash2 size={13} />
                                    </button>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── ASSERTIONS ── */}
                      <div className="assertion-box">
                        <label className="extract-toggle">
                          <input
                            type="checkbox"
                            checked={step.assertions.enabled}
                            onChange={(e) => updateStepAssertion(step.id, "enabled", e.target.checked)}
                          />
                          Enable Assertions
                        </label>

                        {step.assertions.enabled && (
                          <>
                            {/* ── Numeric assertions (existing) ── */}
                            <div className="assertion-section-label">Response Metrics</div>
                            <div className="extract-fields">
                              <input
                                type="number"
                                placeholder="Expected Status Code"
                                value={step.assertions.status_code}
                                onChange={(e) => updateStepAssertion(step.id, "status_code", e.target.value)}
                              />
                              <input
                                type="number"
                                placeholder="Max Response Time (ms)"
                                value={step.assertions.max_response_time}
                                onChange={(e) => updateStepAssertion(step.id, "max_response_time", e.target.value)}
                              />
                              <input
                                type="number"
                                placeholder="Allowed Error Rate (%)"
                                value={step.assertions.max_error_rate}
                                onChange={(e) => updateStepAssertion(step.id, "max_error_rate", e.target.value)}
                              />
                            </div>

                            {/* ✅ NEW: Text / Response Assertions (JMeter Response Assertion) */}
                            <div className="assertion-section-label" style={{ marginTop: "14px" }}>
                              Response Assertions
                              <button
                                type="button"
                                className="add-text-assertion-btn"
                                onClick={() => addTextAssertion(step.id)}
                              >
                                <Plus size={12} /> Add
                              </button>
                            </div>

                            {(step.assertions.text_assertions || []).length === 0 && (
                              <p className="no-assertion-hint">No response assertions added. Click "+ Add" to check response body, headers, or status text.</p>
                            )}

                            {(step.assertions.text_assertions || []).map((ta) => (
                              <div className="text-assertion-row" key={ta.id}>

                                {/* Field to check */}
                                <select
                                  className="ta-select"
                                  value={ta.field}
                                  onChange={(e) => updateTextAssertion(step.id, ta.id, "field", e.target.value)}
                                  title="What to check"
                                >
                                  <option value="body">Response Body</option>
                                  <option value="status_text">Status Text</option>
                                  <option value="headers">Response Headers</option>
                                </select>

                                {/* Condition */}
                                <select
                                  className="ta-select"
                                  value={ta.condition}
                                  onChange={(e) => updateTextAssertion(step.id, ta.id, "condition", e.target.value)}
                                  title="Condition"
                                >
                                  <option value="contains">Contains</option>
                                  <option value="not_contains">Not Contains</option>
                                  <option value="equals">Equals</option>
                                  <option value="starts_with">Starts With</option>
                                  <option value="ends_with">Ends With</option>
                                  <option value="matches_regex">Matches Regex</option>
                                </select>

                                {/* Value */}
                                <input
                                  className="ta-value"
                                  type="text"
                                  placeholder='e.g. "userId" or ^\d+$'
                                  value={ta.value}
                                  onChange={(e) => updateTextAssertion(step.id, ta.id, "value", e.target.value)}
                                />

                                {/* Remove */}
                                <button
                                  type="button"
                                  className="remove-param-btn"
                                  onClick={() => removeTextAssertion(step.id, ta.id)}
                                  title="Remove assertion"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </>
                        )}
                      </div>

                      {/* VARIABLE EXTRACTION */}
                      <div className="extract-box">
                        <label className="extract-toggle">
                          <input
                            type="checkbox"
                            checked={step.extractVariable}
                            onChange={(e) => updateStep(step.id, "extractVariable", e.target.checked)}
                          />
                          Extract JWT / Variable
                        </label>
                        {step.extractVariable && (
                          <div className="extract-fields">
                            <input placeholder="Variable Name" value={step.variableName} onChange={(e) => updateStep(step.id, "variableName", e.target.value)} />
                            <input placeholder="JSON Path" value={step.jsonPath} onChange={(e) => updateStep(step.id, "jsonPath", e.target.value)} />
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </SortableStep>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <button type="submit" className="submit-btn">
          <PlayCircle size={16} />
          {id ? "Update Test" : "Create Test"}
        </button>
      </form>
    </div>
  );
}

export default CreateTest;
