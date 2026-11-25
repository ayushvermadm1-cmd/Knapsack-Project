"""
=============================================================
  Intelligent Inventory Management – Knapsack Optimization
  Flask Backend | DAA Project 5
=============================================================
"""

from flask import Flask, render_template, request, jsonify
import time

app = Flask(__name__)


# ─────────────────────────────────────────────────────────
#  ALGORITHM 1 — Greedy Fractional Knapsack
#  Time  Complexity : O(n log n)   — dominated by sort
#  Space Complexity : O(n)         — sorted copy + result
# ─────────────────────────────────────────────────────────
def greedy_knapsack(items, capacity):
    """
    Solve the Fractional Knapsack problem using a Greedy approach.
    Items can be taken in fractions.
    Always produces the optimal solution for fractional version.

    Args:
        items    : list of dicts [{name, weight, profit}, ...]
        capacity : int — total knapsack capacity

    Returns:
        dict with totalProfit, weightUsed, selected, timeMs
    """
    start = time.perf_counter()

    # Sort items by profit-to-weight ratio (descending)
    sorted_items = sorted(
        [dict(item, ratio=item['profit'] / item['weight']) for item in items],
        key=lambda x: x['ratio'],
        reverse=True
    )

    remaining = capacity
    total_profit = 0.0
    selected = []

    for item in sorted_items:
        if remaining <= 0:
            break

        if item['weight'] <= remaining:
            # Take the full item
            remaining    -= item['weight']
            total_profit += item['profit']
            selected.append({
                'name':     item['name'],
                'weight':   item['weight'],
                'profit':   item['profit'],
                'taken':    item['weight'],
                'fraction': 1.0,
                'isFull':   True
            })
        else:
            # Take a fraction of the item
            fraction      = remaining / item['weight']
            total_profit += fraction * item['profit']
            selected.append({
                'name':     item['name'],
                'weight':   item['weight'],
                'profit':   round(fraction * item['profit'], 2),
                'taken':    round(remaining, 2),
                'fraction': round(fraction, 4),
                'isFull':   False
            })
            remaining = 0

    elapsed_ms = (time.perf_counter() - start) * 1000

    return {
        'totalProfit': round(total_profit, 2),
        'weightUsed':  round(capacity - remaining, 2),
        'selected':    selected,
        'timeMs':      round(elapsed_ms, 6)
    }


# ─────────────────────────────────────────────────────────
#  ALGORITHM 2 — Dynamic Programming 0/1 Knapsack
#  Time  Complexity : O(n × W)
#  Space Complexity : O(n × W)
# ─────────────────────────────────────────────────────────
def dp_knapsack(items, capacity):
    """
    Solve the 0/1 Knapsack problem using Dynamic Programming.
    Each item is either taken fully or not at all.
    Guarantees the globally optimal solution.

    Recurrence:
        dp[i][w] = dp[i-1][w]                            if weight[i] > w
        dp[i][w] = max(dp[i-1][w],
                       profit[i] + dp[i-1][w-weight[i]]) otherwise

    Args:
        items    : list of dicts [{name, weight, profit}, ...]
        capacity : int — total knapsack capacity

    Returns:
        dict with totalProfit, weightUsed, selected, table, tracedCells, timeMs
    """
    start = time.perf_counter()

    n = len(items)
    W = capacity

    # Build (n+1) x (W+1) DP table initialised to 0
    dp = [[0] * (W + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        wt = items[i - 1]['weight']
        pr = items[i - 1]['profit']
        for w in range(W + 1):
            # Option 1: Don't take item i
            dp[i][w] = dp[i - 1][w]
            # Option 2: Take item i (if it fits)
            if wt <= w:
                dp[i][w] = max(dp[i][w], pr + dp[i - 1][w - wt])

    # ── Traceback to find selected items ──
    selected     = []
    traced_cells = []
    w = W
    for i in range(n, 0, -1):
        traced_cells.append(f"{i},{w}")
        if dp[i][w] != dp[i - 1][w]:
            # Item i was included
            selected.append({
                'name':     items[i - 1]['name'],
                'weight':   items[i - 1]['weight'],
                'profit':   items[i - 1]['profit'],
                'taken':    items[i - 1]['weight'],
                'fraction': 1.0,
                'isFull':   True
            })
            w -= items[i - 1]['weight']
    traced_cells.append(f"0,{w}")

    selected.reverse()
    elapsed_ms = (time.perf_counter() - start) * 1000

    # Limit table to first 50 columns for transport efficiency
    max_cols = min(W, 50)
    table_trimmed = [[dp[i][w] for w in range(max_cols + 1)] for i in range(n + 1)]

    return {
        'totalProfit': dp[n][W],
        'weightUsed':  sum(it['weight'] for it in selected),
        'selected':    selected,
        'table':       table_trimmed,
        'tracedCells': traced_cells,
        'timeMs':      round(elapsed_ms, 6),
        'tableCols':   max_cols,
        'capacity':    W
    }


# ─────────────────────────────────────────────────────────
#  ROUTES
# ─────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/run', methods=['POST'])
def run_algorithms():
    """Run both algorithms on the submitted inventory data."""
    data     = request.get_json()
    items    = data.get('items', [])
    capacity = int(data.get('capacity', 50))

    if not items:
        return jsonify({'error': 'No items provided'}), 400

    greedy_result = greedy_knapsack(items, capacity)
    dp_result     = dp_knapsack(items, capacity)

    return jsonify({
        'greedy': greedy_result,
        'dp':     dp_result
    })


# ─────────────────────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 55)
    print("  Knapsack Optimization Server Starting...")
    print("  Open: http://127.0.0.1:5000")
    print("=" * 55)
    app.run(debug=True, port=5000)
