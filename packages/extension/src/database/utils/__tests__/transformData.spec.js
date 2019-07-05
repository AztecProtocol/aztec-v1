import transformDataForDb, {
    undefinedField,
} from '../transformDataForDb';
import transformDataFromDb from '../transformDataFromDb';

describe('transformDataForDb & transformDataFromDb', () => {
    const fields = [
        'name',
        'color',
    ];

    it('transform data object to an array for db', () => {
        expect(transformDataForDb(fields, {
            name: 'guacamole',
            color: 'green',
        })).toEqual([
            'guacamole',
            'green',
        ]);
    });

    it('transform data array to an object from db', () => {
        expect(transformDataFromDb(fields, [
            'pikachu',
            'yellow',
        ])).toEqual({
            name: 'pikachu',
            color: 'yellow',
        });
    });

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
