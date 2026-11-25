# 📦 Intelligent Inventory Management – Knapsack Optimization

**DAA Project 5** | Python + Flask Web Application

## 📌 Problem Statement
Develop an inventory selection system that helps a warehouse manager select products to maximize total profit without exceeding a given storage capacity. Each product has a weight and profit value. Implements both **Greedy (Fractional Knapsack)** and **Dynamic Programming (0/1 Knapsack)** approaches and compares their results and performance.

## 🚀 Features
- ✅ Greedy Fractional Knapsack — `O(n log n)`
- ✅ Dynamic Programming 0/1 Knapsack — `O(n × W)`
- ✅ DP Table Visualization with traceback path
- ✅ Performance Comparison Bar Chart
- ✅ Side-by-side algorithm results
- ✅ Viva Notes section

## 🛠 Tech Stack
- **Backend:** Python 3, Flask
- **Frontend:** HTML5, CSS3, JavaScript (Canvas API)
- **Font:** Inter, JetBrains Mono (Google Fonts)

## ⚙️ How to Run

```bash
# 1. Install dependencies
pip install flask

# 2. Run the server
python app.py

# 3. Open in browser
http://127.0.0.1:5000
```

## 📊 Algorithms

### Greedy (Fractional Knapsack)
- Sort items by profit/weight ratio (descending)
- Take items greedily; allow fractions
- **Time:** O(n log n) | **Space:** O(n)

### Dynamic Programming (0/1 Knapsack)
- Build dp[i][w] table: max profit using first i items with capacity w
- Recurrence: `dp[i][w] = max(dp[i-1][w], profit[i] + dp[i-1][w-weight[i]])`
- **Time:** O(n × W) | **Space:** O(n × W)

## 📁 Project Structure
```
knapsack-optimizer/
├── app.py               ← Python Flask server + algorithms
├── templates/
│   └── index.html       ← HTML frontend template
└── static/
    ├── style.css        ← Dark theme styling
    └── ui.js            ← Frontend logic & charts
```

## 👨‍💻 Author
Aryanshi Singh | DAA Project 5
