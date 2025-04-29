import { createProjectGraph, createSkillsGraph } from './graphs.js';

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
                            transactions(
                                where: {
                                    type: {_eq: "xp"},
                                    path: {_nilike: "%piscine%"}
                                }
                                order_by: {createdAt: asc}
                            ) {
                                amount
                                createdAt
                                path
                                type
                            }
                            skills: transactions(
                                where: {
                                    type: {_regex: "^skill_.*"}
                                }
                                order_by: {amount: desc}
                            ) {
                                type
                                amount
                                createdAt
                                path
                            }
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

        // Отдельно фильтруем XP транзакции
        const xpTransactions = (userData.transactions || []).filter(t => t.type === 'xp');

        const skillsMap = {};
        userData.skills.forEach(skill => {
            if (!skill.type.startsWith('skill_')) return;
            
            const skillName = skill.type.replace('skill_', '');
            const amount = Math.round(skill.amount);
            
            if (!skillsMap[skillName] || skillsMap[skillName].amount < amount) {
                skillsMap[skillName] = {
                    name: skillName,
                    amount: amount
                };
            }
        });

        userData.skills = Object.values(skillsMap)
            .sort((a, b) => b.amount - a.amount);

        document.getElementById("username-display").textContent = userData.login;
        updateUserInterface(userData);

        return userData;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        throw error;
    }
}

function updateUserInterface(userData) {
    const personalInfo = document.getElementById("personal-info");
    const totalXP = userData.transactions.reduce((sum, t) => sum + t.amount, 0);
    const completedProjects = userData.progresses ? 
        userData.progresses.filter(p => p.grade > 0).length : 0;
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

    createProjectGraph(document.getElementById('line-chart'), userData);
    createSkillsGraph(document.getElementById('skills-chart'), userData);
}