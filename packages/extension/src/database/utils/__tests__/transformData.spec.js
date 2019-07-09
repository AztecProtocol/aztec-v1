import transformDataForDb, {
    undefinedField,
} from '../transformDataForDb';
import transformDataFromDb from '../transformDataFromDb';

const fields = [
    'name',
    'color',
];

describe('transformDataForDb', () => {
    it('transform data object to an array for db', () => {
        expect(transformDataForDb(fields, {
            name: 'guacamole',
            color: 'green',
        })).toEqual([
            'guacamole',
            'green',
        ]);
    });

    it('always transform data to an array', () => {
        expect(transformDataForDb(fields, null)).toEqual([
            undefinedField,
            undefinedField,
        ]);
    });
});

describe('transformDataFromDb', () => {
    it('transform data array to an object from db', () => {
        expect(transformDataFromDb(fields, [
            'pikachu',
            'yellow',
        ])).toEqual({
            name: 'pikachu',
            color: 'yellow',
        });
    });

    it('return null if data in db does not exist', () => {
        expect(transformDataFromDb(fields, null)).toEqual(null);
    });
});

describe('transformDataForDb & transformDataFromDb', () => {
    it('save undefined values as {undefinedField} and ignore them when transform back', () => {
        const longFields = [
            'name',
            'age',
            'gender',
            'color',
        ];
        const data = {
            name: 'pikachu',
            color: 'yellow',
        };

        const dataArray = transformDataForDb(longFields, data);
        expect(dataArray).toEqual([
            'pikachu',
            undefinedField,
            undefinedField,
            'yellow',
        ]);

        const recovered = transformDataFromDb(longFields, dataArray);
        expect(recovered).toEqual(data);
    });

    it('will keep empty value if they are not exactly the same as undefinedField', () => {
        const longFields = [
            'name',
            'age',
            'height',
            'color',
        ];
        const emptyValues = [
            0,
            +0,
            false,
            null,
            undefined,
            '',
        ];
        emptyValues.forEach((emptyValue) => {
            const data = {
                name: 'pikachu',
                color: 'yellow',
                age: emptyValue,
            };

            const dataArray = transformDataForDb(longFields, data);
            expect(dataArray).toEqual([
                'pikachu',
                emptyValue,
                undefinedField,
                'yellow',
            ]);

            const recovered = transformDataFromDb(longFields, dataArray);
            expect(recovered).toEqual(data);
        });
    });
});
