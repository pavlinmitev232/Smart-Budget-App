@echo off
SET TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIwLCJlbWFpbCI6ImdvYWx0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzY0NzIxNjExLCJleHAiOjE3NjY0ODA4MTF9.BofsRMSF3eQMj2L1v9M09EY9gVVyG05oyTqWeJ9VXTw

echo === TEST 1: Create Goal (Emergency Fund) ===
curl -X POST http://localhost:5000/api/goals -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"name\":\"Emergency Fund\",\"goal_type\":\"savings\",\"target_amount\":5000,\"priority\":\"high\",\"deadline\":\"2026-06-30\"}"
echo.
echo.

echo === TEST 2: Create Goal (Vacation) ===
curl -X POST http://localhost:5000/api/goals -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"name\":\"Dream Vacation\",\"goal_type\":\"purchase\",\"target_amount\":3000,\"current_amount\":500,\"priority\":\"medium\"}"
echo.
echo.

echo === TEST 3: Get All Goals ===
curl -X GET http://localhost:5000/api/goals -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo === TEST 4: Allocate Money to Goal 1 ===
curl -X POST http://localhost:5000/api/goals/1/allocate -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"amount\":1000}"
echo.
echo.

echo === TEST 5: Get Goal 1 Details ===
curl -X GET http://localhost:5000/api/goals/1 -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo === TEST 6: Test Tier Limit (Create 4th Goal - Should Fail for Free Tier) ===
curl -X POST http://localhost:5000/api/goals -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"name\":\"Car Fund\",\"goal_type\":\"purchase\",\"target_amount\":20000}"
echo.
echo.
curl -X POST http://localhost:5000/api/goals -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"name\":\"House Down Payment\",\"goal_type\":\"savings\",\"target_amount\":50000}"
echo.
echo.

echo === All Tests Complete! ===
