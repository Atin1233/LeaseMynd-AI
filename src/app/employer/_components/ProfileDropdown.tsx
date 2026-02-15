"use client";

import React, { useRef, useEffect, useState } from "react";
import styles from "~/styles/Employer/ProfileDropdown.module.css";
import { useEmployerAuth } from "~/lib/auth/EmployerAuthContext";
import { LogOut } from "lucide-react";

const ProfileDropdown: React.FC = () => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useEmployerAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = (user.name ?? user.email ?? "U")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.profileButton}
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        <span className={styles.defaultAvatar}>{initials}</span>
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name || "User"}</span>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
          <div className={styles.divider} />
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className={styles.dropdownItem}
              style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
