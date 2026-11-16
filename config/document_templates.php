<?php

return [
    'python_binary' => env('PDF_PYTHON_BINARY', 'python'),
    'libreoffice_binary' => env('LIBREOFFICE_BINARY', 'soffice'),
    'max_upload_kilobytes' => (int) env('DOCUMENT_TEMPLATE_MAX_KB', 20480),
    'worker_timeout_seconds' => (int) env('DOCUMENT_TEMPLATE_WORKER_TIMEOUT', 120),
];
