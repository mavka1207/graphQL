import { createProjectGraph, createAuditGraph } from './graphs.js';

export async function fetchUserData(token) {
    try {
        const response = await fetch("https://01.gritlab.ax/api/graphql-engine/v1/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                query: `
                    query {
                        user {
                            id
                            login
                            firstName
                            lastName
                            campus
                            auditRatio
                            totalUp
                            totalDown
                            # XP транзакции
                            transactions(
                                where: {
                                    _and: [
                                        {type: {_eq: "xp"}},
                                        {_or: [
                                            {_and: [
                                                {path: {_nilike: "%piscine-go%"}},
                                                {path: {_nilike: "%piscine-js%"}}
                                            ]},
                                            {path: {_ilike: "%/piscine-js"}}
                                        ]}
                                    ]
                                }
                                order_by: {createdAt: asc}
                            ) {
                                amount
                                createdAt
                                path
                            }
                            # Навыки
                            skills: transactions(
                                where: {
                                    type: {_like: "skill_%"}
                                }
                                order_by: {amount: desc}
                            ) {
                                type
                                amount
                                path
                            }
                            # Общая сумма XP
                            xpTotal: transactions_aggregate(
                                where: {
                                    type: {_eq: "xp"}
                                }
                            ) {
                                aggregate {
                                    sum {
                                        amount
                                    }
                                }
                            }
                            
                            # Прогресс по проектам
                            progresses(
                                where: {
                                    object: { type: {_eq: "project"} }
                                }
                                order_by: {createdAt: asc}
                            ) {
                                grade
                                createdAt
                                object {
                                    name
                                    type
                                }
                                path
                            }
                        }
                    }
                `
            })
        });

        const data = await response.json();
        console.log("Fetched data:", data);

        if (data.errors) {
            throw new Error(data.errors[0].message);
        }

        const userData = data.data.user[0];
        document.getElementById("username-display").textContent = userData.login;
        updateUserInterface(userData);

        return userData;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        throw error;
    }
}

function updateUserInterface(userData) {
    console.log('Updating UI with user data:', userData);
    const personalInfo = document.getElementById("personal-info");
    
    // Вычисляем общий XP, исключая пискины
    const totalXP = userData.transactions.reduce((sum, t) => sum + t.amount, 0);

    // Считаем завершенные проекты
    const completedProjects = userData.progresses.filter(p => p.grade > 0).length;

    // Вычисляем аудит рейтинг
    const auditRatio = (userData.totalUp / userData.totalDown).toFixed(1);

    personalInfo.innerHTML = `
        <div class="info-card">
            <h3>${userData.firstName} ${userData.lastName}</h3>
            <h4>User Information</h4>
            <p>Username: ${userData.login}</p>
            <p>id number: ${userData.id}</p>
            <h4>Projects Information</h4>
            <p>Total XP: ${Math.round(totalXP / 1000)}k</p>
            <p>Projects: ${completedProjects} completed</p>
            <h4>Audit Information</h4>
            <p>Audit Ratio: ${auditRatio}</p>
            <p>Audits done: ${userData.totalUp}</p>
            <p>Audits received: ${userData.totalDown}</p>
        </div>
    `;

    createGraphs(userData);
}

function createGraphs(userData) {
    createProjectGraph(document.getElementById('line-chart'), userData);
    createAuditGraph(document.getElementById('bar-chart'), userData);
}