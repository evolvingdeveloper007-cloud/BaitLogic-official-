async function loadDashboard() {

    const key =
        document
            .getElementById(
                "adminKey"
            )
            .value;

    if (!key) {
        alert(
            "Enter admin key"
        );
        return;
    }

    try {

        const response =
            await fetch(
                "/api/admin/summary",
                {
                    headers: {
                        "x-admin-key":
                            key
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Unauthorized"
            );
        }

        document
            .getElementById(
                "signups"
            )
            .textContent =
            data.signups || 0;

        document
            .getElementById(
                "reports"
            )
            .textContent =
            data.reports || 0;

        document
            .getElementById(
                "catches"
            )
            .textContent =
            data.catches || 0;

    } catch (error) {

        alert(
            error.message
        );

    }
}