    /**
    * Only authenticated admins can create staff.
    */
    public function authorize(): bool
    {
    $user = $this->user();

    return $user !== null
    && $user->admin !== null
    && $user->admin->exists;
    }

    /**
    * Validation rules for creating a staff account.
    *
    * @return array<string, ValidationRule|array<mixed>|string>
        */
        public function rules(): array
        {
        return [
        'username' => [
        'required',
        'string',
        'max:255',
        'alpha_dash',
        'unique:users,username',
        ],
        'password' => [
        'required',
        'string',
        'min:8',
        ],
        'first_name' => ['required', 'string', 'max:255'],
        'middle_name' => ['nullable', 'string', 'max:255'],
        'last_name' => ['required', 'string', 'max:255'],
        'birth_date' => ['required', 'date', 'before_or_equal:today'],
        'gender' => [
        'required',
        'string',
        'max:50',
        'in:Male,Female,Prefer not to say',
        ],
        'civil_status' => [
        'required',
        'string',
        'max:50',
        'in:Single,Married,Separated,Divorced,Widowed',
        ],
        'address' => ['required', 'string', 'max:255'],
        'contact_number' => ['required', 'string', 'max:20'],
        'email' => [
        'required',
        'email',
        'max:255',
        'unique:users,email',
        ],
        ];
        }