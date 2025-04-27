import { createProjectGraph, createAuditGraph, createTimeProgressGraph } from './graphs.js';

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
                            auditRatio
                            totalUp
                            totalDown
                            transactions(where: {type: {_eq: "xp"}}, order_by: {createdAt: asc}) {
                                id
                                type
                                amount
                                createdAt
                                path
                                object {
                                    name
                                    type
                                }
                            }
                            progresses(order_by: {createdAt: asc}) {
                                id
                                grade
                                createdAt
                                updatedAt
                                object {
                                    id
                                    name
                                    type
                                }
                                path
                            }
                            xpTotal: transactions_aggregate(where: {type: {_eq: "xp"}}) {
                                aggregate {
                                    sum {
                                        amount
                                    }
                                }
                            }
                        }
                    }
                `
            })
        });

        const data = await response.json();
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }

        const userData = data.data.user[0];
        document.getElementById("username-display").textContent = userData.login;
        updateUserInterface(userData);

    } catch (error) {
        console.error("Failed to fetch user data:", error);
    }
}

function updateUserInterface(userData) {
    const personalInfo = document.getElementById("personal-info");
    const totalXP = userData.transactions.reduce((sum, t) => sum + t.amount, 0);

    const projects = userData.progresses.reduce((acc, p) => {
        if (p.object?.type === 'project') {
            acc.total++;
            if (p.grade > 0) acc.passed++;
        }
        return acc;
    }, { total: 0, passed: 0 });

    const auditRatio = (userData.totalUp / userData.totalDown).toFixed(1);

    personalInfo.innerHTML = `
        <div class="info-card">
            <h3>${userData.firstName} ${userData.lastName}</h3>
            <h4> User Information</h4>
            <p>Username: ${userData.login}</p>
            <p>id number: ${userData.id}</p>
            <h4>Projects Information </h4>
            <p>Total XP: ${Math.round(totalXP / 1000)}k</p>
            <p>Projects: ${projects.passed}/${projects.total} completed</p>
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
    createTimeProgressGraph(document.getElementById('time-chart'), userData);
}