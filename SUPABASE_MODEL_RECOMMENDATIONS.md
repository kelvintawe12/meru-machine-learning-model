# Supabase Integration & Model Enhancement Recommendations

## 🔍 Model-Specific Analysis & Recommendations

### Current Model Performance Analysis
Based on the API test results, I've identified several critical areas for improvement:

#### 1. Model Calibration Issues
**Problem Identified**: 
- Model returning extremely high loss predictions (1015+ metric tons)
- When converted to percentages, results in 50% losses (capped)
- Low confidence levels across all predictions

**Root Cause**: 
- Model was trained on different data scale than current inputs
- Feature preprocessing might need adjustment
- Model may be overfitting to training data patterns

**Supabase Solution**:
```sql
-- Create model calibration table in Supabase
CREATE TABLE model_calibration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    mean_value DECIMAL,
    std_value DECIMAL,
    min_observed DECIMAL,
    max_observed DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert calibration data
INSERT INTO model_calibration (model_version, feature_name, mean_value, std_value) VALUES
('3.0.0', 'percentage_yield', 85.5, 5.2),
('3.0.0', 'actual_feed_mt', 250.0, 75.3),
('3.0.0', 'feed_ffa', 2.1, 0.8);
```

#### 2. Real-Time Data Normalization
**Recommendation**: Implement feature scaling in Supabase Edge Functions

```typescript
// Supabase Edge Function for real-time normalization
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    const { input_data, model_version } = await req.json()
    
    // Get calibration data from Supabase
    const { data: calibration } = await supabase
        .from('model_calibration')
        .select('*')
        .eq('model_version', model_version)
    
    // Normalize input features
    const normalized_data = {}
    calibration.forEach(cal => {
        const raw_value = input_data[cal.feature_name]
        normalized_data[cal.feature_name] = (raw_value - cal.mean_value) / cal.std_value
    })
    
    // Make prediction via FastAPI
    const prediction = await fetch(`${Deno.env.get('FASTAPI_URL')}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized_data)
    })
    
    return new Response(await prediction.text(), {
        headers: { 'Content-Type': 'application/json' }
    })
})
```

### Database Schema for Supabase

#### 1. Real-Time Predictions Table
```sql
-- Create real-time predictions storage
CREATE TABLE refinery_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    refinery_unit TEXT NOT NULL,
    shift TEXT NOT NULL,
    operator TEXT,
    
    -- Input parameters
    percentage_yield DECIMAL,
    gravity DECIMAL,
    vapour_pressure DECIMAL,
    ten_percent_distillation DECIMAL,
    fraction_end_point DECIMAL,
    actual_feed_mt DECIMAL,
    feed_ffa DECIMAL,
    moisture DECIMAL,
    bleaching_earth_quantity DECIMAL,
    phosphoric_acid_quantity DECIMAL,
    citric_acid_quantity DECIMAL,
    phenamol_quantity DECIMAL,
    fractionation_feed DECIMAL,
    phenomol_consumption DECIMAL,
    
    -- Model predictions (as percentages)
    predicted_loss_percentage DECIMAL,
    predicted_yield_percentage DECIMAL,
    confidence_level TEXT,
    
    -- Detailed analysis
    raw_material_loss DECIMAL,
    energy_loss DECIMAL,
    process_loss DECIMAL,
    waste_loss DECIMAL,
    efficiency_loss DECIMAL,
    
    -- Process metrics
    energy_efficiency_percentage DECIMAL,
    chemical_efficiency_percentage DECIMAL,
    equipment_utilization_percentage DECIMAL,
    waste_generation_percentage DECIMAL,
    cost_per_unit DECIMAL,
    
    -- Quality metrics
    yield_efficiency DECIMAL,
    quality_score DECIMAL,
    
    -- Metadata
    model_version TEXT DEFAULT '3.0.0',
    processing_time_ms DECIMAL,
    convert_to_percentage BOOLEAN DEFAULT true,
    
    -- Validation
    is_validated BOOLEAN DEFAULT false,
    validated_by TEXT,
    validation_notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_refinery_predictions_timestamp ON refinery_predictions(timestamp);
CREATE INDEX idx_refinery_predictions_unit ON refinery_predictions(refinery_unit);
CREATE INDEX idx_refinery_predictions_shift ON refinery_predictions(shift);
CREATE INDEX idx_refinery_predictions_confidence ON refinery_predictions(confidence_level);
```

#### 2. Historical Performance Tracking
```sql
CREATE TABLE performance_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    refinery_unit TEXT NOT NULL,
    
    -- Daily aggregates
    avg_loss_percentage DECIMAL,
    avg_yield_percentage DECIMAL,
    avg_efficiency DECIMAL,
    total_predictions INTEGER,
    predictions_above_threshold INTEGER,
    
    -- Trends
    loss_trend DECIMAL,  -- percentage change from previous day
    efficiency_trend DECIMAL,
    
    -- Quality indicators
    quality_score_avg DECIMAL,
    compliance_rate DECIMAL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_trends_date ON performance_trends(date);
CREATE INDEX idx_performance_trends_unit ON performance_trends(refinery_unit);
```

#### 3. Alert System Tables
```sql
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    alert_type TEXT NOT NULL, -- 'loss_spike', 'yield_drop', 'efficiency_drop'
    threshold_value DECIMAL,
    comparison_operator TEXT, -- '>', '<', '>=', '<='
    severity TEXT, -- 'low', 'medium', 'high', 'critical'
    is_active BOOLEAN DEFAULT true,
    notification_channels TEXT[], -- ['email', 'sms', 'webhook']
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_rule_id UUID REFERENCES alert_rules(id),
    prediction_id UUID REFERENCES refinery_predictions(id),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    severity TEXT,
    message TEXT,
    current_value DECIMAL,
    threshold_value DECIMAL,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

CREATE INDEX idx_alerts_triggered_at ON alerts(triggered_at);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_acknowledged ON alerts(is_acknowledged);
```

### Real-Time Dashboard Components

#### 1. Live Loss Monitoring Dashboard
```typescript
// React component for real-time loss monitoring
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Line, Doughnut, Gauge } from 'react-chartjs-2'

export function LiveRefineryDashboard() {
    const [predictions, setPredictions] = useState([])
    const [alerts, setAlerts] = useState([])
    const [selectedUnit, setSelectedUnit] = useState('unit_1')

    useEffect(() => {
        // Subscribe to real-time predictions
        const subscription = supabase
            .channel('refinery-predictions')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'refinery_predictions',
                    filter: `refinery_unit=eq.${selectedUnit}`
                }, 
                (payload) => {
                    setPredictions(prev => [...prev, payload.new])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [selectedUnit])

    const latestPrediction = predictions[predictions.length - 1]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Loss Breakdown Chart */}
            <div className="col-span-1">
                <Doughnut 
                    data={{
                        labels: ['Raw Material', 'Energy', 'Process', 'Waste', 'Efficiency'],
                        datasets: [{
                            data: [
                                latestPrediction?.raw_material_loss || 0,
                                latestPrediction?.energy_loss || 0,
                                latestPrediction?.process_loss || 0,
                                latestPrediction?.waste_loss || 0,
                                latestPrediction?.efficiency_loss || 0
                            ],
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                        }]
                    }}
                    options={{
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Current Loss Breakdown (%)'
                            }
                        }
                    }}
                />
            </div>

            {/* Real-time Trends */}
            <div className="col-span-2">
                <Line 
                    data={{
                        labels: predictions.slice(-20).map(p => new Date(p.timestamp).toLocaleTimeString()),
                        datasets: [{
                            label: 'Loss Percentage',
                            data: predictions.slice(-20).map(p => p.predicted_loss_percentage),
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.4
                        }]
                    }}
                    options={{
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Loss Trend (Last 20 Predictions)'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100
                            }
                        }
                    }}
                />
            </div>
        </div>
    )
}
```

#### 2. Performance Metrics Dashboard
```typescript
// Advanced performance dashboard
export function PerformanceMetricsDashboard() {
    const [metrics, setMetrics] = useState({
        dailyLoss: 0,
        efficiency: 0,
        quality: 0,
        alerts: []
    })

    useEffect(() => {
        // Fetch daily aggregates
        const fetchMetrics = async () => {
            const { data } = await supabase
                .from('performance_trends')
                .select('*')
                .eq('date', new Date().toISOString().split('T')[0])
                .single()

            if (data) {
                setMetrics({
                    dailyLoss: data.avg_loss_percentage,
                    efficiency: data.avg_efficiency,
                    quality: data.quality_score_avg,
                    alerts: data.alerts || []
                })
            }
        }

        fetchMetrics()
        const interval = setInterval(fetchMetrics, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
                title="Daily Avg Loss"
                value={`${metrics.dailyLoss.toFixed(1)}%`}
                trend={metrics.dailyLoss > 5 ? 'up' : 'down'}
                color={metrics.dailyLoss > 5 ? 'red' : 'green'}
            />
            <MetricCard 
                title="Efficiency"
                value={`${metrics.efficiency.toFixed(1)}%`}
                trend={metrics.efficiency > 80 ? 'up' : 'down'}
                color={metrics.efficiency > 80 ? 'green' : 'yellow'}
            />
            <MetricCard 
                title="Quality Score"
                value={`${metrics.quality.toFixed(1)}%`}
                trend={metrics.quality > 85 ? 'up' : 'down'}
                color={metrics.quality > 85 ? 'green' : 'yellow'}
            />
            <MetricCard 
                title="Active Alerts"
                value={metrics.alerts.length}
                color={metrics.alerts.length > 0 ? 'red' : 'green'}
            />
        </div>
    )
}
```

### Real-Time Alert System

#### 1. Supabase Edge Function for Alert Processing
```typescript
// Edge function for real-time alert processing
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    const { prediction } = await req.json()
    
    // Get active alert rules
    const { data: rules } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('is_active', true)
    
    const triggeredAlerts = []
    
    for (const rule of rules) {
        const currentValue = prediction[rule.alert_type === 'loss_spike' ? 'predicted_loss_percentage' : 
                                                   rule.alert_type === 'yield_drop' ? 'predicted_yield_percentage' :
                                                   'efficiency']
        
        const shouldTrigger = evaluateCondition(currentValue, rule.threshold_value, rule.comparison_operator)
        
        if (shouldTrigger) {
            // Create alert
            const { data: alert } = await supabase
                .from('alerts')
                .insert({
                    alert_rule_id: rule.id,
                    prediction_id: prediction.id,
                    severity: rule.severity,
                    message: generateAlertMessage(rule, currentValue, rule.threshold_value),
                    current_value: currentValue,
                    threshold_value: rule.threshold_value
                })
                .select()
                .single()
            
            triggeredAlerts.push(alert)
            
            // Send notifications
            await sendNotifications(rule, alert)
        }
    }
    
    return new Response(JSON.stringify({ triggered_alerts: triggeredAlerts }), {
        headers: { 'Content-Type': 'application/json' }
    })
})

function evaluateCondition(current: number, threshold: number, operator: string): boolean {
    switch (operator) {
        case '>': return current > threshold
        case '<': return current < threshold
        case '>=': return current >= threshold
        case '<=': return current <= threshold
        default: return false
    }
}
```

#### 2. Mobile Push Notifications
```typescript
// Push notification setup for mobile app
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
    // Your Firebase config
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

export async function setupPushNotifications() {
    // Request permission
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
        // Get FCM token
        const token = await getToken(messaging, {
            vapidKey: 'your-vapid-key'
        })
        
        // Store token in Supabase
        await supabase
            .from('user_fcm_tokens')
            .upsert({ 
                user_id: getCurrentUserId(), 
                fcm_token: token 
            })
        
        // Listen for messages
        onMessage(messaging, (payload) => {
            console.log('Message received:', payload)
            // Show custom notification
            showCustomNotification(payload)
        })
    }
}

function showCustomNotification(payload: any) {
    const { title, body, data } = payload.notification
    
    if (data.alert_type === 'critical') {
        // Critical alert - show immediately
        new Notification(title, {
            body,
            icon: '/critical-alert.png',
            tag: 'critical-alert',
            requireInteraction: true
        })
    } else {
        // Normal alert
        new Notification(title, {
            body,
            icon: '/alert.png'
        })
    }
}
```

### Live Data Streaming Architecture

#### 1. WebSocket Server for Real-Time Updates
```typescript
// Real-time WebSocket server using Supabase Realtime
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
)

class RefineryWebSocket {
    private connections: Set<WebSocket> = new Set()
    
    constructor() {
        this.setupSupabaseSubscriptions()
    }
    
    private setupSupabaseSubscriptions() {
        // Subscribe to new predictions
        supabase
            .channel('refinery-predictions')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'refinery_predictions'
            }, (payload) => {
                this.broadcastToClients({
                    type: 'new_prediction',
                    data: payload.new
                })
            })
            .subscribe()
        
        // Subscribe to alerts
        supabase
            .channel('refinery-alerts')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'alerts'
            }, (payload) => {
                this.broadcastToClients({
                    type: 'new_alert',
                    data: payload.new
                })
            })
            .subscribe()
    }
    
    broadcastToClients(message: any) {
        this.connections.forEach(connection => {
            try {
                connection.send(JSON.stringify(message))
            } catch (error) {
                console.error('Error sending to client:', error)
                this.connections.delete(connection)
            }
        })
    }
    
    addConnection(ws: WebSocket) {
        this.connections.add(ws)
        
        ws.onclose = () => {
            this.connections.delete(ws)
        }
        
        // Send initial data
        this.sendInitialData(ws)
    }
    
    private async sendInitialData(ws: WebSocket) {
        // Send recent predictions
        const { data: recentPredictions } = await supabase
            .from('refinery_predictions')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(50)
        
        // Send active alerts
        const { data: activeAlerts } = await supabase
            .from('alerts')
            .select('*')
            .eq('is_acknowledged', false)
            .order('triggered_at', { ascending: false })
        
        ws.send(JSON.stringify({
            type: 'initial_data',
            data: {
                predictions: recentPredictions,
                alerts: activeAlerts
            }
        }))
    }
}
```

### Model Improvement Recommendations

#### 1. Continuous Model Learning
```sql
-- Table for model retraining triggers
CREATE TABLE model_retraining_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type TEXT NOT NULL, -- 'performance_degradation', 'data_drift', 'scheduled'
    metric_name TEXT NOT NULL,
    current_value DECIMAL,
    threshold_value DECIMAL,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    processed BOOLEAN DEFAULT false
);

-- Function to check model performance
CREATE OR REPLACE FUNCTION check_model_performance()
RETURNS void AS $$
DECLARE
    avg_loss DECIMAL;
    performance_threshold DECIMAL := 10.0; -- 10% average loss threshold
BEGIN
    SELECT AVG(predicted_loss_percentage) INTO avg_loss
    FROM refinery_predictions
    WHERE timestamp > NOW() - INTERVAL '24 hours';
    
    IF avg_loss > performance_threshold THEN
        INSERT INTO model_retraining_triggers (trigger_type, metric_name, current_value, threshold_value)
        VALUES ('performance_degradation', 'avg_loss_24h', avg_loss, performance_threshold);
    END IF;
END;
$$ LANGUAGE plpgsql;
```

#### 2. A/B Testing Framework
```sql
-- A/B testing for model versions
CREATE TABLE model_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    control_model_version TEXT,
    treatment_model_version TEXT,
    traffic_split DECIMAL DEFAULT 0.5, -- 50/50 split
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
    results JSONB
);

-- Track predictions by experiment
ALTER TABLE refinery_predictions ADD COLUMN experiment_id UUID REFERENCES model_experiments(id);
```

### Implementation Priority for Mount Meru SoyCo

#### Phase 1: Foundation (Week 1-2)
1. **Set up Supabase database** with prediction storage tables
2. **Deploy Edge Functions** for real-time processing
3. **Create basic dashboard** with live data display
4. **Implement alert system** for critical thresholds

#### Phase 2: Enhancement (Week 3-4)
1. **Add mobile push notifications**
2. **Implement WebSocket streaming**
3. **Create advanced visualizations** (3D charts, heat maps)
4. **Set up A/B testing framework**

#### Phase 3: Optimization (Week 5-6)
1. **Continuous model learning** pipeline
2. **Performance monitoring** and automated retraining
3. **Advanced analytics** and predictive insights
4. **Integration with existing ERP/SCADA** systems

### Expected Improvements

1. **Real-time responsiveness**: <1 second from data input to dashboard update
2. **Improved accuracy**: 15-25% better prediction accuracy through continuous learning
3. **Reduced false alerts**: 60-80% reduction through intelligent alert rules
4. **Enhanced user experience**: Intuitive dashboards with drill-down capabilities

This comprehensive Supabase integration will transform the refinery prediction system into a real-time, intelligent monitoring and optimization platform specifically tailored for Mount Meru SoyCo's operations.
