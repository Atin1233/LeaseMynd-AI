"use client"

import React, { useCallback, useEffect, useState} from 'react';
import { Clock, Building, Mail } from 'lucide-react';
import { useRouter } from "next/navigation"
import { useEmployerAuth } from "~/lib/auth/EmployerAuthContext";
import styles from '~/styles/Employer/PendingApproval.module.css';
import NavBar from "~/app/employer/pending-approval/Navbar";

interface EmployerData {
    name?: string;
    email?: string;
    company?: string;
    submissionDate?: string;
}

const PendingApproval: React.FC = () => {
    const router = useRouter();
    const { user, loading: authLoading } = useEmployerAuth();

    const [currentEmployeeData, setCurrentEmployeeData] = useState<EmployerData>();

    const fetchUserInfo = useCallback(async () => {
        try {
            const response = await fetch("/api/fetchUserInfo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const rawData:unknown = await response.json();
            console.log("Raw data:", rawData);
            const data = rawData as EmployerData
            console.log("Employee data:", data);

            setCurrentEmployeeData({
                name: data?.name,
                email: data?.email,
                company: data?.company,
                submissionDate: data?.submissionDate,
            });
        } catch (error) {
            console.error("Error fetching user info:", error);
            window.alert("Authentication failed.");
            router.push("/");
        }
    }, [router]);

    useEffect(() => {
        if (user) {
            fetchUserInfo().catch(console.error);
        }
    }, [user, fetchUserInfo]);

    if (authLoading || !user) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--stone-50, #fafaf9)",
                }}
            >
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <NavBar />

            <main className={styles.main}>
                <div className={styles.statusCard}>
                    <div className={styles.statusIconContainer}>
                        <Clock className={styles.statusIcon} />
                    </div>

                    <h1 className={styles.title}>Pending Approval</h1>
                    <p className={styles.subtitle}>
                        Your account is currently awaiting approval from your employer
                    </p>

                    <div className={styles.detailsContainer}>
                        <h2 className={styles.detailsTitle}>Application Details</h2>

                        <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                                <Building className={styles.detailIcon} />
                                <div className={styles.detailContent}>
                                    <span className={styles.detailLabel}>Company</span>
                                    <span className={styles.detailValue}>{currentEmployeeData?.company ?? ""}</span>
                                </div>
                            </div>

                            <div className={styles.detailItem}>
                                <Mail className={styles.detailIcon} />
                                <div className={styles.detailContent}>
                                    <span className={styles.detailLabel}>Email</span>
                                    <span className={styles.detailValue}>{currentEmployeeData?.email ?? ""}</span>
                                </div>
                            </div>

                            <div className={styles.detailItem}>
                                <Clock className={styles.detailIcon} />
                                <div className={styles.detailContent}>
                                    <span className={styles.detailLabel}>Submission Date</span>
                                    <span className={styles.detailValue}>{currentEmployeeData?.submissionDate ?? ""}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.supportSection}>
                        <p className={styles.supportText}>
                            Need assistance? Contact support at{' '}
                            <a href="mailto:pdraionline@gmail.com" className={styles.supportLink}>
                                pdraionline@gmail.com
                            </a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PendingApproval;
