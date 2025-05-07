import { createProjectGraph, createSkillsGraph } from './graphs.js';
import {
    validateAndCalculateXP,
    formatXP,
    calculateCompletedProjects,
    calculateAuditRatio,
    calculateAuditActivityRatio
} from './dataUtils.js';

// GraphQL query to fetch user data including XP, skills, and progress
export async function fetchUserData(token) {
    try {
        // API request configuration
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
                                _and: [
                                    { event: { path: { _eq: "/gritlab/school-curriculum" }}},
                                    { type: { _eq: "xp" } }
                                ]
                                }
                                order_by: { createdAt: asc }
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

        // Process and validate response
        const data = await response.json();
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }

        const userData = data.data.user[0];

        // Store filtered XP transactions
        userData.xp = userData.transactions;
        delete userData.transactions;

        // Process skills data and calculate percentages
        const skillsMap = {};
        userData.skills.forEach(skill => {
            if (!skill.type.startsWith('skill_')) return;
            // Extract skill name and normalize amount
            const skillName = skill.type.replace('skill_', '');
            const amount = Math.round(skill.amount);
            // Keep highest amount for each skill
            if (!skillsMap[skillName] || skillsMap[skillName].amount < amount) {
                skillsMap[skillName] = { name: skillName, amount: amount };
            }
        });

        // Sort skills by amount in descending order
        userData.skills = Object.values(skillsMap)
            .sort((a, b) => b.amount - a.amount);

        // Update UI with user data
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

    const totalXP = validateAndCalculateXP(userData.xp || []);
    
    const totalKB = formatXP(totalXP);
    const completedProjects = calculateCompletedProjects(userData.progresses);
    const auditRatio = calculateAuditRatio(userData.totalUp, userData.totalDown);
    const auditActivityRatio = calculateAuditActivityRatio(userData.totalUp, userData.totalDown);
    
    personalInfo.innerHTML = `
        <div class="person-info-container key-value-title">
            <h3>${userData.firstName} ${userData.lastName}</h3>
            <div id="grids-container">
                <div class="title-and-grid-container">
                    <h4>User information</h4>
                    <div class="personal-info key-value-info">
                        <span class="key-text">username:</span>
                        <span class="key-text">${userData.login}</span>
                        <span class="key-text">id number:</span>
                        <span class="key-text">${userData.id}</span>
                    </div>
                </div>

                <div class="title-and-grid-container">
                    <h4>Projects information</h4>
                    <div class="audit-info key-value-info">
                        <span class="key-text">total xp:</span>
                        <span class="key-text">${totalKB}</span>
                        <span class="key-text">projects completed:</span>
                        <span class="key-text">${completedProjects}</span>
                    </div>
                </div>

                <div class="title-and-grid-container">
                    <h4>Audits information</h4>
                    <div class="audit-info key-value-info">
                        <span class="key-text">audits done:</span>
                        <span class="key-text">${userData.totalUp}</span>
                        <span class="key-text">audits ratio:</span>
                        <span class="key-text">${auditRatio}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    createProjectGraph(document.getElementById('line-chart'), userData);
    createSkillsGraph(document.getElementById('skills-chart'), userData);
}
