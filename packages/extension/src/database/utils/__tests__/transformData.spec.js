import transformDataForDb, {
    undefinedField,
} from '../transformDataForDb';
import transformDataFromDb from '../transformDataFromDb';
import transformToDbData from '../transformToDbData';

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

    it('return null if input storage data is not valid', () => {
        expect(transformDataFromDb(fields)).toEqual(null);
        expect(transformDataFromDb(fields, null)).toEqual(null);
        expect(transformDataFromDb(fields, 123)).toEqual(null);
        expect(transformDataFromDb(fields, '123')).toEqual(null);
        expect(transformDataFromDb(fields, {})).toEqual(null);
    });
});

describe('transformToDbData', () => {
    it('transform raw data to match the data for model', () => {
        expect(transformToDbData(fields, {
            id: 'poke0',
            name: 'pikachu',
            color: 'yellow',
            height: 60,
        })).toEqual({
            name: 'pikachu',
            color: 'yellow',
        });
    });

    it('return null if input data is not valid', () => {
        expect(transformToDbData(fields)).toEqual(null);
        expect(transformToDbData(fields, null)).toEqual(null);
        expect(transformToDbData(fields, 123)).toEqual(null);
        expect(transformToDbData(fields, '123')).toEqual(null);
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
