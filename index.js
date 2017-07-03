import { create } from 'rung-sdk';
import { String as Text, Double } from 'rung-cli/dist/types';
import agent from 'superagent';
import promisifyAgent from 'superagent-promise';
import Bluebird from 'bluebird';

var numeral = require('numeral');

const request = promisifyAgent(agent, Bluebird);

function render(proxConcurso,estimativaPremio,dtProximo){
    return _("Proximo concurso {{proxConcurso}} com premio estimado de R$ {{estimativaPremio}} em {{dtProximo}}",
        {proxConcurso, estimativaPremio, dtProximo});
}


function main(context, done) {
    const { valorMinimo } = context.params;

    request.get('https://api.vitortec.com/loterias/megasena/v1.2/')
    .then(resultado => {
        const proxConcurso = parseInt(resultado.body.data.concurso) + 1;
        const estimativaPremio = resultado.body.data.proximoConcurso.estimativa;
        var dtProximo = resultado.body.data.proximoConcurso.data;
		var avisa = false;
        var alertas = [];

		//define format 'pt-br' para uso do numeral
		numeral.register('locale', 'pt-br', {
			delimiters: {
				thousands: '.',
				decimal: ','
			},
			abbreviations: {
				thousand: 'mil',
				million: 'milhões',
				billion: 'b',
				trillion: 't'
			},
			ordinal: function (number) {
				return 'º';
			},
			currency: {
				symbol: 'R$'
			}
		});
		numeral.locale('pt-br');


		if ( numeral(estimativaPremio).value() >= ( (numeral(valorMinimo).value())*1000000 ) ){
			avisa = true;
		}

        if (avisa) {
            alertas.push({
                title: 'Vale apostar!',
                content: render(proxConcurso,estimativaPremio,dtProximo)
            });
        }

        done ({alerts: alertas});

    });

}

const params = {
    valorMinimo: {
        description: _('Informe o valor minimo (em milhoes) estimado para o premio acumulado para que seja avisado do concurso'),
        type: Double,
        required: true
    }
};

export default create(main, {
    params,
    primaryKey: true,
    title: _("Vale Apostar!"),
    description: _("Seja informado quando a Mega Sena tiver um premio atrativo!"),
    preview: render('Vale Apostar!')
});

