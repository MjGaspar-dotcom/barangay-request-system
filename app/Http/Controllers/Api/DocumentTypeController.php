<?php

// This tells Laravel which namespace this controller belongs to.
namespace App\Http\Controllers\Api;

// Import Laravel's base Controller class.
use App\Http\Controllers\Controller;

// Import the DocumentType model.
// This allows us to communicate with the document_types database table.
use App\Models\DocumentType;

// Import Laravel's Request class.
// This lets us receive data sent by the frontend.
use Illuminate\Http\Request;


// This controller handles API requests related to document types.
//
// It is located inside the Api namespace because this controller
// will be used by our React frontend through API requests.
class DocumentTypeController extends Controller
{
    /**
     * Display all document types.
     *
     * This method is called when the frontend sends:
     *
     * GET /api/document-types
     *
     * Example:
     * React → GET request → Laravel → index()
     */
    public function index()
    {
        // Get ALL records from the document_types table.
        //
        // DocumentType represents the document_types database table.
        $documentTypes = DocumentType::all();

        // Send the results back to the frontend as JSON.
        //
        // 'success' tells the frontend whether the operation succeeded.
        // 'data' contains the actual document types.
        return response()->json([
            'success' => true,
            'data' => $documentTypes
        ]);
    }


    /**
     * Store a new document type.
     *
     * This method is called when the frontend sends:
     *
     * POST /api/document-types
     *
     * The frontend sends information such as:
     * document_name
     * description
     * processing_days
     * is_active
     */
    public function store(Request $request)
    {
        // Validate the information received from the frontend.
        //
        // If validation fails, Laravel automatically returns
        // a validation error response.
        $validated = $request->validate([

            // document_name is required.
            // It must be text.
            // Maximum length is 255 characters.
            // It must also be unique in the document_types table.
            'document_name' => 'required|string|max:255|unique:document_types,document_name',

            // description is optional.
            // If provided, it must be text.
            'description' => 'nullable|string',

            // processing_days is required.
            // It must be a whole number.
            // The minimum allowed value is 1.
            'processing_days' => 'required|integer|min:1',

            // is_active is optional.
            // If provided, it must be true/false.
            'is_active' => 'boolean',
        ]);

        // Create a new DocumentType database record
        // using the validated information.
        //
        // This works because these fields are listed
        // in the model's $fillable property.
        $documentType = DocumentType::create($validated);

        // Return the newly created document type as JSON.
        //
        // HTTP status 201 means:
        // "Created successfully."
        return response()->json([
            'success' => true,
            'message' => 'Document type created successfully.',
            'data' => $documentType
        ], 201);
    }


    /**
     * Display one specific document type.
     *
     * This method is called when the frontend sends:
     *
     * GET /api/document-types/{id}
     *
     * Example:
     * GET /api/document-types/1
     *
     * The "1" is passed into the $id parameter.
     */
    public function show(string $id)
    {
        // Find the document type using its primary key.
        //
        // Our primary key is document_type_id,
        // which we configured inside DocumentType.php.
        //
        // findOrFail() means:
        // - If the record exists → return it.
        // - If it doesn't exist → Laravel returns a 404 error.
        $documentType = DocumentType::findOrFail($id);

        // Return the selected document type as JSON.
        return response()->json([
            'success' => true,
            'data' => $documentType
        ]);
    }


    /**
     * Update an existing document type.
     *
     * This method is called when the frontend sends:
     *
     * PUT /api/document-types/{id}
     *
     * Example:
     * PUT /api/document-types/1
     */
    public function update(Request $request, string $id)
    {
        // First, find the document type that we want to update.
        //
        // If the ID doesn't exist, Laravel returns a 404 error.
        $documentType = DocumentType::findOrFail($id);

        // Validate the new information.
        $validated = $request->validate([

            // The document name is required.
            //
            // The unique rule prevents TWO document types
            // from having the same document_name.
            //
            // The current record is excluded from the uniqueness check.
            // Otherwise, updating a record without changing its name
            // would incorrectly fail validation.
            'document_name' => 'required|string|max:255|unique:document_types,document_name,' . $id . ',document_type_id',

            // Description is optional.
            'description' => 'nullable|string',

            // Processing days must be at least 1.
            'processing_days' => 'required|integer|min:1',

            // is_active must be true or false if provided.
            'is_active' => 'boolean',
        ]);

        // Update the existing database record
        // using the validated information.
        $documentType->update($validated);

        // Return the updated record to the frontend.
        return response()->json([
            'success' => true,
            'message' => 'Document type updated successfully.',
            'data' => $documentType
        ]);
    }


    /**
     * Delete a document type.
     *
     * This method is called when the frontend sends:
     *
     * DELETE /api/document-types/{id}
     *
     * Example:
     * DELETE /api/document-types/1
     */
    public function destroy(string $id)
    {
        // Find the document type we want to delete.
        //
        // If it doesn't exist, Laravel returns a 404 error.
        $documentType = DocumentType::findOrFail($id);

        // Delete the record from the database.
        $documentType->delete();

        // Tell the frontend that the deletion was successful.
        return response()->json([
            'success' => true,
            'message' => 'Document type deleted successfully.'
        ]);
    }
}