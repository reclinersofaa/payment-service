const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3003;
const promClient = require('prom-client');
promClient.collectDefaultMetrics();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        service: 'payment-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Basic payment endpoints
app.get('/api/payments', (req, res) => {
    res.json({
        message: 'Payment service is running',
        payments: [
            { id: 1, orderId: 1, amount: 99.99, status: 'completed' },
            { id: 2, orderId: 2, amount: 149.50, status: 'pending' }
        ]
    });
});

app.get('/api/payments/:id', (req, res) => {
    const { id } = req.params;
    res.json({
        id: parseInt(id),
        orderId: 1,
        amount: 99.99,
        status: 'completed',
        transactionId: `TXN${Date.now()}`,
        message: 'Payment retrieved successfully'
    });
});

app.post('/api/payments', (req, res) => {
    // Simulate payment processing
    const isSuccessful = Math.random() > 0.1; // 90% success rate
    
    if (isSuccessful) {
        res.status(201).json({
            message: 'Payment processed successfully',
            payment: {
                id: Date.now(),
                orderId: req.body.orderId,
                amount: req.body.amount,
                status: 'completed',
                transactionId: `TXN${Date.now()}`
            }
        });
    } else {
        res.status(400).json({
            message: 'Payment processing failed',
            error: 'Insufficient funds or invalid card'
        });
    }
});

// Get payments by order
app.get('/api/payments/order/:orderId', (req, res) => {
    const { orderId } = req.params;
    res.json({
        orderId: parseInt(orderId),
        payments: [
            { id: 1, amount: 99.99, status: 'completed' }
        ],
        message: 'Order payments retrieved successfully'
    });
});

// Process refund
app.post('/api/payments/:id/refund', (req, res) => {
    const { id } = req.params;
    res.json({
        message: 'Refund processed successfully',
        refund: {
            paymentId: parseInt(id),
            amount: 99.99,
            status: 'refunded',
            refundId: `REF${Date.now()}`
        }
    });
});

// Test communication with order service
app.get('/api/payments/test-order-service', async (req, res) => {
    try {
        const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';
        const response = await axios.get(`${orderServiceUrl}/health`);
        res.json({
            message: 'Order service communication successful',
            orderServiceStatus: response.data
        });
    } catch (error) {
        res.status(500).json({
            message: 'Order service communication failed',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
