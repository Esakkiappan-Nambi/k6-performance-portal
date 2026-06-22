import React, {
    useEffect,
    useState
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";

function ReportList() {

    const [reports, setReports] =
        useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports =
    async () => {

        try {

            const response =
                await axios.get(
                    "http://127.0.0.1:8000/test-runs"
                );

            setReports(
                response.data
            );

        } catch (error) {

            console.log(error);

        }
    };

    return (

        <div
            style={{
                padding:"20px"
            }}
        >

            <h1>
                Reports
            </h1>

            <table border="1">

                <thead>

                    <tr>

                        <th>Run ID</th>
                        <th>Status</th>
                        <th>Started At</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {reports.map(
                        (report) => (

                        <tr key={report.id}>

                            <td>
                                {report.id}
                            </td>

                            <td>
                                {report.status}
                            </td>

                            <td>
                                {report.started_at}
                            </td>

                            <td>

                                <button
                                    onClick={() =>
                                        navigate(
                                            `/reports/${report.id}`
                                        )
                                    }
                                >
                                    View Report
                                </button>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}

export default ReportList;