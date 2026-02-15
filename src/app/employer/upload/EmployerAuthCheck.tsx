"use client";

import React, { useState, useEffect, type PropsWithChildren } from "react";
import { useEmployerAuth } from "~/lib/auth/EmployerAuthContext";
import { useRouter } from "next/navigation";
import LoadingPage from "~/app/_components/loading";

interface EmployerAuthCheckProps {
    onAuthSuccess: (userId: string) => void;
}

const EmployerAuthCheck: React.FC<PropsWithChildren<EmployerAuthCheckProps>> = ({
                                                                                    onAuthSuccess,
                                                                                    children,
                                                                                }) => {
    const { user, loading: authLoading } = useEmployerAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            alert("Authentication failed! No user found.");
            router.push("/");
            return;
        }

        onAuthSuccess(user.userId);
        setLoading(false);
    }, [authLoading, user, router, onAuthSuccess]);

    if (loading || authLoading) {
        return <LoadingPage />;
    }

    return <>{children}</>;
};

export default EmployerAuthCheck;
