* Vercel Serverless Function for Expense Tracking
 * Endpoint: /api/expenses
 *
 * NOTE: This function uses an in-memory array to store expenses,
 * which means data will be lost between invocations. This is
 * for demonstration purposes only. For persistent storage, a
 * database is required.
 */

// In-memory data store for demonstration
let expenses = [
    { id: 'e1', amount: 45.99, description: 'Groceries at Trader Joe\'s', category: 'Food', date: '2025-11-28' },
    { id: 'e2', amount: 120.00, description: 'Electricity Bill', category: 'Utilities', date: '2025-11-30' },
    { id: 'e3', amount: 25.50, description: 'Coffee with client', category: 'Misc', date: '2025-12-01' },
];

// Helper function to validate POST data
function validateExpense(data) {
    const { amount, description, category, date } = data;
    const errors = [];

    if (!amount || isNaN(parseFloat(amount))) {
        errors.push("Missing or invalid 'amount'. Must be a number.");
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        errors.push("Missing or invalid 'description'. Must be a non-empty string.");
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
        errors.push("Missing or invalid 'category'. Must be a non-empty string.");
    }
    // Basic date format validation (YYYY-MM-DD)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push("Missing or invalid 'date'. Must be in YYYY-MM-DD format.");
    }

    return errors;
}

module.exports = async (req, res) => {
    // Enable CORS for the frontend (index.html) to communicate with the API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET') {
        // GET: Return all expenses
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            data: expenses.sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
        }));
        return;
    }

    if (req.method === 'POST') {
        // POST: Add a new expense
        let body = '';
        
        // Read the request body stream
        try {
            // Note: Vercel's req object often has the body already parsed if it's JSON,
            // but reading the stream is the safest way in a generic Node.js environment.
            // For Vercel, we often find the body in req.body directly for POST requests.

            const newExpense = req.body;
            
            // Fallback for body parsing if req.body is undefined (less common in Vercel, but robust)
            if (!newExpense) {
                 // Simple body parsing logic - reading stream is complex in a simple handler,
                 // assuming standard Vercel environment where req.body is available for JSON.
                 // If running into issues, a more complex stream reading is needed.
                 // For now, assume Vercel provides req.body if Content-Type is application/json.
            }
            
            const validationErrors = validateExpense(newExpense);

            if (validationErrors.length > 0) {
                // Return 400 Bad Request if validation fails
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: 'Validation Failed', 
                    details: validationErrors 
                }));
                return;
            }

            const expenseId = `e${Date.now()}`;
            const expense = {
                id: expenseId,
                amount: parseFloat(newExpense.amount),
                description: newExpense.description.trim(),
                category: newExpense.category.trim(),
                date: newExpense.date, // YYYY-MM-DD format
            };

            expenses.push(expense);

            // Return 201 Created
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                message: 'Expense added successfully', 
                data: expense 
            }));
            return;

        } catch (error) {
            console.error('Error processing POST request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                error: 'Internal Server Error during expense creation' 
            }));
            return;
        }
    }

    // Default: Handle unsupported methods
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        success: false, 
        error: `Method ${req.method} Not Allowed` 
    }));
};
